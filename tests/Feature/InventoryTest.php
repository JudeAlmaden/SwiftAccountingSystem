<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_inventory_page(): void
    {
        $this->get(route('inventory.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_inventory_page(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('inventory/index'));
    }

    public function test_authenticated_users_can_create_inventory_items(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('inventory.store'), [
                'sku' => 'INV-100',
                'name' => 'A4 Paper',
                'description' => 'Office paper stock',
                'unit' => 'ream',
                'quantity_on_hand' => 20,
                'low_stock_threshold' => 5,
                'status' => 'active',
            ])
            ->assertRedirect(route('inventory.index'));

        $this->assertDatabaseHas('inventory_items', [
            'sku' => 'INV-100',
            'name' => 'A4 Paper',
            'quantity_on_hand' => 20,
        ]);
    }

    public function test_duplicate_sku_is_rejected(): void
    {
        InventoryItem::create([
            'sku' => 'INV-100',
            'name' => 'Existing Item',
            'quantity_on_hand' => 10,
            'low_stock_threshold' => 2,
            'status' => 'active',
        ]);

        $this->actingAs(User::factory()->create())
            ->from(route('inventory.index'))
            ->post(route('inventory.store'), [
                'sku' => 'INV-100',
                'name' => 'Duplicate Item',
                'quantity_on_hand' => 4,
                'low_stock_threshold' => 1,
                'status' => 'active',
            ])
            ->assertRedirect(route('inventory.index'))
            ->assertSessionHasErrors('sku');
    }

    public function test_authenticated_users_can_update_inventory_items(): void
    {
        $item = InventoryItem::create([
            'sku' => 'INV-200',
            'name' => 'Ink Cartridge',
            'quantity_on_hand' => 8,
            'low_stock_threshold' => 2,
            'status' => 'active',
        ]);

        $this->actingAs(User::factory()->create())
            ->put(route('inventory.update', $item), [
                'sku' => 'INV-200',
                'name' => 'Ink Cartridge XL',
                'description' => 'Updated description',
                'unit' => 'pcs',
                'low_stock_threshold' => 3,
                'status' => 'inactive',
            ])
            ->assertRedirect(route('inventory.index'));

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'name' => 'Ink Cartridge XL',
            'status' => 'inactive',
            'low_stock_threshold' => 3,
        ]);
    }

    public function test_increase_adjustment_updates_stock_and_records_movement(): void
    {
        $user = User::factory()->create();
        $item = InventoryItem::create([
            'sku' => 'INV-300',
            'name' => 'Whiteboard Marker',
            'quantity_on_hand' => 6,
            'low_stock_threshold' => 2,
            'status' => 'active',
        ]);

        $this->actingAs($user)
            ->post(route('inventory.adjustments.store', $item), [
                'type' => 'increase',
                'quantity' => 4,
                'reason' => 'Restocked from supplier',
            ])
            ->assertRedirect(route('inventory.index'));

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity_on_hand' => 10,
        ]);

        $this->assertDatabaseHas('inventory_movements', [
            'inventory_item_id' => $item->id,
            'user_id' => $user->id,
            'type' => 'increase',
            'quantity' => 4,
            'reason' => 'Restocked from supplier',
        ]);
    }

    public function test_decrease_adjustment_updates_stock_and_records_movement(): void
    {
        $user = User::factory()->create();
        $item = InventoryItem::create([
            'sku' => 'INV-400',
            'name' => 'Folder',
            'quantity_on_hand' => 9,
            'low_stock_threshold' => 3,
            'status' => 'active',
        ]);

        $this->actingAs($user)
            ->post(route('inventory.adjustments.store', $item), [
                'type' => 'decrease',
                'quantity' => 5,
                'reason' => 'Issued to department',
            ])
            ->assertRedirect(route('inventory.index'));

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity_on_hand' => 4,
        ]);

        $this->assertDatabaseHas('inventory_movements', [
            'inventory_item_id' => $item->id,
            'user_id' => $user->id,
            'type' => 'decrease',
            'quantity' => 5,
        ]);
    }

    public function test_decrease_adjustment_cannot_exceed_available_stock(): void
    {
        $item = InventoryItem::create([
            'sku' => 'INV-500',
            'name' => 'Toner',
            'quantity_on_hand' => 2,
            'low_stock_threshold' => 1,
            'status' => 'active',
        ]);

        $this->actingAs(User::factory()->create())
            ->from(route('inventory.index'))
            ->post(route('inventory.adjustments.store', $item), [
                'type' => 'decrease',
                'quantity' => 3,
                'reason' => 'Issued to branch office',
            ])
            ->assertRedirect(route('inventory.index'))
            ->assertSessionHasErrors('quantity');

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity_on_hand' => 2,
        ]);

        $this->assertSame(0, InventoryMovement::count());
    }
}
