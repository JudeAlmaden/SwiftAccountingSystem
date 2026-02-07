import { Disbursement } from '@/types/database';

interface VoucherTemplateProps {
    disbursement: Disbursement;
}

export function VoucherTemplate({ disbursement }: VoucherTemplateProps) {
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
            <div className="px-[1.5cm] sm:px-[2.5cm] py-[1cm] pb-[2.5cm] min-h-[297mm] flex flex-col font-serif">
                {/* Header */}
                <div className="text-center mb-0">
                    <img src="/Sacli/Format_3.jpg" alt="ST. ANNE COLLEGE LUCENA, INC." className="w-full max-w-[400px] mx-auto mb-2" />
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.05em', marginTop: '8px' }}>CHECK VOUCHER</h2>
                </div>

                {/* Top Right Info - NO and DATE */}
                <div className="flex justify-end mb-1 text-[10px]" style={{ gap: '20px' }}>
                    <div style={{ textAlign: 'left', minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '4px' }}>
                            <span className="font-bold" style={{ marginRight: '15px', minWidth: '40px' }}>NO.</span>
                            <span style={{ borderBottom: '1px dotted black', flex: 1, paddingBottom: '2px' }}>
                                {disbursement.control_number?.split('-').pop()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span className="font-bold" style={{ marginRight: '15px', minWidth: '40px' }}>DATE</span>
                            <span style={{ borderBottom: '1px dotted black', flex: 1, paddingBottom: '2px' }}>
                                {formatDate(disbursement.created_at)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Table - Extended to fill page */}
                <div className="flex-grow flex flex-col mb-2">
                    <table className="w-full border-collapse flex-grow" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th className="p-0.5 text-center text-[10px] font-bold w-24" style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                                    ACCOUNT NO.
                                </th>
                                <th className="p-0.5 text-center text-[10px] font-bold flex-1" style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                                    PARTICULARS
                                </th>
                                <th className="p-0.5 text-center text-[10px] font-bold w-8" style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                                    REF.
                                </th>
                                <th className="p-0.5 text-center text-[10px] font-bold w-24" style={{ borderRight: '1px solid black', borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                                    DEBIT
                                </th>
                                <th className="p-0.5 text-center text-[10px] font-bold w-24" style={{ borderTop: '2px solid black', borderBottom: '2px solid black' }}>
                                    CREDIT
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Actual data rows */}
                            {allItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ borderRight: '1px solid black', height: '5px' }}>
                                        {item.account?.account_code}
                                    </td>
                                    <td className={`px-0 py-0 text-[10px] ${item.type === 'credit' ? 'pl-6' : 'pl-2'}`} style={{ borderRight: '1px solid black', height: '5px' }}>
                                        {item.account?.account_name}
                                    </td>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ borderRight: '1px solid black', height: '5px' }}>
                                        &nbsp;
                                    </td>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ borderRight: '1px solid black', height: '5px' }}>
                                        {item.type === 'debit' ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                    </td>
                                    <td className="px-0 py-0 text-[10px] text-center" style={{ height: '5px' }}>
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
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', height: '24px', padding: '0px 4px', fontSize: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    &nbsp;
                                </td>
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', height: '24px', padding: '0px 4px', fontSize: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    TOTAL
                                </td>
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', height: '24px', padding: '0px 4px', fontSize: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    &nbsp;
                                </td>
                                <td style={{ borderRight: '1px solid black', borderBottom: '2px solid black', textDecoration: 'underline', height: '24px', padding: '0px 4px', fontSize: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td style={{ borderBottom: '2px solid black', textDecoration: 'underline', height: '24px', padding: '0px 4px', fontSize: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Explanation */}
                <div style={{ padding: '8px', minHeight: '80px', fontSize: '10px', marginBottom: '16px', borderBottom: '2px solid black' }}>
                    <div style={{ lineHeight: '1.4' }}> <span style={{ fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', marginBottom: '4px', paddingBottom: '2px' }}>
                        EXPLANATION:</span>{disbursement.description}
                    </div>
                </div>

                {/* Footer Signature Lines */}
                <div style={{ fontSize: '10px', marginTop: '16px' }}>
                    {[
                        [
                            { label: 'PREPARED BY', step: 1 },
                            { label: 'APPROVED BY', step: 2 }
                        ],
                        [
                            { label: 'CHECKED BY', step: 3 },
                            { label: 'PAID BY', step: 4 }
                        ],
                        [
                            { label: 'RECOMMENDED BY', step: null },
                            { label: 'RECEIVED BY', step: null }
                        ],
                    ].map((row, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '40px',
                                marginBottom: i < 2 ? '12px' : 0,
                            }}
                        >
                            {row.map(({ label, step }) => {
                                const trackingInfo = step ? disbursement.tracking?.find(t => t.step === step && t.action === 'approved') : null;
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
                                                    paddingBottom: '1px'
                                                }}
                                            >
                                                <span className="font-bold text-[10px] uppercase">
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
