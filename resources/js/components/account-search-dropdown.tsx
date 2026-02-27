import { Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

interface Account {
    id: number;
    account_code: string;
    account_name: string;
    account_type: string;
}

interface AccountSearchDropdownProps {
    onSelect: (account: Account) => void;
    onClose: () => void;
    accounts?: Account[];
}

export default function AccountSearchDropdown({
    onSelect,
    onClose,
    accounts: initialAccounts,
}: AccountSearchDropdownProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts || []);
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>(initialAccounts || []);
    const [isLoading, setIsLoading] = useState(!initialAccounts);

    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    const token = meta?.content || '';

    useEffect(() => {
        inputRef.current?.focus();

        if (initialAccounts) {
            setAccounts(initialAccounts);
            setFilteredAccounts(initialAccounts);
            setIsLoading(false);
            return;
        }

        fetch(route('accounts.index'), {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
            },
        })
            .then(res => res.json())
            .then(data => {
                const accountsData = data.data || [];
                setAccounts(accountsData);
                setFilteredAccounts(accountsData);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch accounts', err);
                setIsLoading(false);
            });
    }, [initialAccounts, token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchQuery.trim() === '') {
                setFilteredAccounts(accounts);
            } else {
                const query = searchQuery.toLowerCase();
                const filtered = accounts.filter(account =>
                    account.account_name.toLowerCase().startsWith(query) ||
                    account.account_code.toLowerCase().startsWith(query) ||
                    account.account_type.toLowerCase().startsWith(query)
                );
                setFilteredAccounts(filtered);
            }
        }, 150);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, accounts]);

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full left-0 z-[10] mt-2 w-full max-w-sm rounded-lg border border-border bg-card shadow-xl"
        >
            <div className="border-b border-border p-3">
                <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-3 py-2">
                    <Search size={14} className="text-muted-foreground flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Start typing..."
                        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <div className="max-h-48 overflow-y-auto scroll-hide">
                <style>{`
                    .scroll-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scroll-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                {isLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Loading accounts...
                    </div>
                ) : filteredAccounts.length > 0 ? (
                    filteredAccounts.slice(0, 3).map((account) => (
                        <button
                            key={account.id}
                            onClick={() => onSelect(account)}
                            className="w-full text-left px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary/40 active:bg-accent/20 border-b border-border/50 last:border-0"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{account.account_name}</span>
                                <span className="text-xs text-muted-foreground">{account.account_code}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{account.account_type}</div>
                        </button>
                    ))
                ) : (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No accounts found
                    </div>
                )}
            </div>

            {!isLoading && filteredAccounts.length > 0 && filteredAccounts.length <= 3 && (
                <div className="border-t border-border/50 bg-secondary/20 px-3 py-2 text-center text-xs text-muted-foreground">
                    {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''} found
                </div>
            )}
        </div>
    );
}
