import { Journal } from '@/types/database';

interface VoucherTemplateProps {
    disbursement: Journal;
}

export function VoucherTemplateDisbursement({ disbursement }: VoucherTemplateProps) {
    const debitItems = disbursement.items?.filter(item => item.type === 'debit') || [];
    const creditItems = disbursement.items?.filter(item => item.type === 'credit') || [];

    const totalDebit = debitItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalCredit = creditItems.reduce((sum, item) => sum + Number(item.amount), 0);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Ensure we have at least 11 rows for the table
    const allItems = disbursement.items || [];
    const emptyRowsNeeded = Math.max(0, 11 - allItems.length);

    return (
        <div id="voucher-paper" className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl" style={{ fontFamily: 'Times New Roman, serif' }}>
            <div className="px-[0.8cm] py-[0.8cm] pb-[2cm] min-h-[297mm] flex flex-col font-serif">
                {/* Header */}
                <div className="text-center mb-0">
                    <img src="/Sacli/Format_3.jpg" alt="ST. ANNE COLLEGE LUCENA, INC." className="w-full max-w-[400px] mx-auto mb-2" />
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.05em', marginTop: '8px', marginBottom: '4px' }}>CHECK VOUCHER</h2>
                </div>

                {/* Top Right Info - NO and DATE */}
                <div
                    className="flex justify-end mb-1"
                    style={{ gap: '20px', fontSize: '11px' }}
                >
                    {/* Check No */}
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span className="font-bold" style={{ marginRight: '6px' }}>
                            Check No.
                        </span>
                        <span
                            style={{
                                borderBottom: '1px dotted black',
                                flex: 1,
                                paddingBottom: '3px',
                                minHeight: '16px',
                                minWidth: '80px',
                                textAlign: 'left',
                            }}
                        >
                            {disbursement.check_id}
                        </span>
                    </div>

                    {/* No */}
                    <div style={{ display: 'flex', alignItems: 'baseline', minWidth: '140px' }}>
                        <span className="font-bold" style={{ marginRight: '6px' }}>
                            No.
                        </span>
                        <span
                            style={{
                                borderBottom: '1px dotted black',
                                flex: 1,
                                paddingBottom: '3px',
                                minHeight: '16px',
                            }}
                        >
                            {disbursement.control_number}
                        </span>
                    </div>

                    {/* Date */}
                    <div style={{ display: 'flex', alignItems: 'baseline', minWidth: '120px' }}>
                        <span className="font-bold" style={{ marginRight: '6px' }}>
                            Date
                        </span>
                        <span
                            style={{
                                borderBottom: '1px dotted black',
                                flex: 1,
                                paddingBottom: '3px',
                                minHeight: '16px',
                            }}
                        >
                            {formatDate(disbursement.created_at)}
                        </span>
                    </div>
                </div>

                {/* Main Table - Extended to fill page */}
                <div className="flex-grow flex flex-col mb-2">
                    <table className="w-full border-collapse flex-grow" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black', padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '96px' }}>
                                    ACCOUNT NO.
                                </th>
                                <th style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black', padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                                    PARTICULARS
                                </th>
                                <th style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black', padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '32px' }}>
                                    REF.
                                </th>
                                <th style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black', padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '96px' }}>
                                    DEBIT
                                </th>
                                <th style={{ borderTop: '2px solid black', borderBottom: '2px solid black', padding: '6px 4px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', width: '96px' }}>
                                    CREDIT
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Actual data rows */}
                            {allItems.map((item) => (
                                <tr key={item.id}>
                                    <td style={{ borderRight: '1px solid black', height: '5px', padding: '4px 2px', fontSize: '11px', textAlign: 'center' }}>
                                        {item.account?.account_code}
                                    </td>
                                    <td style={{ borderRight: '1px solid black', height: '5px', padding: '4px 2px', fontSize: '11px', paddingLeft: item.type === 'credit' ? '24px' : '8px' }}>
                                        {item.account?.account_name}
                                    </td>
                                    <td style={{ borderRight: '1px solid black', height: '5px', padding: '4px 2px', fontSize: '11px', textAlign: 'center' }}>
                                        &nbsp;
                                    </td>
                                    <td style={{ borderRight: '1px solid black', height: '5px', padding: '4px 2px', fontSize: '11px', textAlign: 'center' }}>
                                        {item.type === 'debit' ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                    </td>
                                    <td style={{ height: '5px', padding: '4px 2px', fontSize: '11px', textAlign: 'center' }}>
                                        {item.type === 'credit' ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                    </td>
                                </tr>
                            ))}

                            {/* Empty rows to fill remaining space */}
                            {Array.from({ length: emptyRowsNeeded }).map((_, index) => (
                                <tr key={`empty-${index}`}>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ borderRight: '1px solid black', height: 'auto' }}>
                                        &nbsp;
                                    </td>
                                    <td className="px-0 py-0 text-[10px]" style={{ borderRight: '1px solid black', height: 'auto' }}>
                                        &nbsp;
                                    </td>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ borderRight: '1px solid black', height: 'auto' }}>
                                        &nbsp;
                                    </td>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ borderRight: '1px solid black', height: 'auto' }}>
                                        &nbsp;
                                    </td>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ height: 'auto' }}>
                                        &nbsp;
                                    </td>
                                </tr>
                            ))}

                            {/* Total Row */}
                            <tr style={{ fontWeight: 'bold' }}>
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', height: '28px', padding: '6px 4px 4px 4px', fontSize: '11px', textAlign: 'center', verticalAlign: 'top' }}>
                                    &nbsp;
                                </td>
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', height: '28px', padding: '6px 4px 4px 4px', fontSize: '11px', textAlign: 'center', verticalAlign: 'top' }}>
                                    TOTAL
                                </td>
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', height: '28px', padding: '6px 4px 4px 4px', fontSize: '11px', textAlign: 'center', verticalAlign: 'top' }}>
                                    &nbsp;
                                </td>
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', textDecoration: 'underline', height: '28px', padding: '6px 4px 4px 4px', fontSize: '11px', textAlign: 'center', verticalAlign: 'top' }}>
                                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ borderBottom: '2px solid black', textDecoration: 'underline', height: '28px', padding: '6px 4px 4px 4px', fontSize: '11px', textAlign: 'center', verticalAlign: 'top' }}>
                                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Explanation */}
                <div style={{ padding: '8px', minHeight: '80px', fontSize: '10px', marginBottom: '16px', borderBottom: '2px solid black' }}>
                    <div style={{ lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                        <span style={{ fontWeight: 'bold', marginTop: '6px' }}>EXPLANATION:</span>
                        <span style={{ marginTop: '6px' }}>{disbursement.description}</span>
                    </div>
                </div>

                {/* Footer Signature Lines */}
                <div style={{ fontSize: '11px', marginTop: '20px' }}>
                    {[
                        [
                            { label: 'PREPARED BY', step: 1 },
                            { label: 'RECOMMENDED BY', step: 2 }
                        ],
                        [
                            { label: 'CHECKED BY', step: 3 },
                            { label: 'APPROVED BY', step: 4 }
                        ],
                        [
                            { label: 'PAID BY', step: null },
                            { label: 'RECEIVED BY', step: null }
                        ],
                    ].map((row, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '40px',
                                marginBottom: '16px',
                            }}
                        >
                            {row.map(({ label, step }) => {
                                // Find the user who performed the action for this step
                                const trackingInfo = step
                                    ? disbursement.tracking?.find(t => t.step === step && t.action === 'approved')
                                    : null;

                                const actorName = trackingInfo?.handler?.name || '';

                                return (
                                    <div
                                        key={label}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                            <p
                                                style={{
                                                    fontWeight: 'bold',
                                                    color: '#1f2937',
                                                    whiteSpace: 'nowrap',
                                                    minWidth: '100px'
                                                }}
                                            >
                                                {label}
                                            </p>
                                            <div
                                                style={{
                                                    borderBottom: '1px dotted black',
                                                    flex: 1,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    paddingBottom: '4px',
                                                    minHeight: '20px',
                                                    alignItems: 'flex-end'
                                                }}
                                            >
                                                <span style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', paddingBottom: '2px' }}>
                                                    {actorName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

            </div>
        </div >
    );
}
