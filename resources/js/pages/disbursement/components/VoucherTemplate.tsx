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

    return (
        <div id="voucher-paper" className="bg-white text-black pt-[1cm] px-[2.5cm] pb-[2.5cm] shadow-2xl mx-auto w-[210mm] min-h-[297mm] flex flex-col font-serif shrink-0 mb-8" style={{ color: '#1a1a1a' }}>
            <div className="flex flex-col items-center mb-0 relative">
                <h1 className="text-xl font-bold uppercase text-center leading-tight">St. Anne College Lucena, Inc.</h1>
                <p className="text-[10px] text-center italic">Diversion Rd., Brgy. Gulang-Gulang</p>
                <p className="text-[10px] text-center italic">Lucena City</p>
                <p className="text-[10px] text-center italic">Tel. Nos. 710-2218</p>

                <h2 className="text-xl font-bold tracking-[0.2em]  uppercase">Check Voucher</h2>
            </div>
            <div className="mt-4 flex flex-col items-end">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase">№</span>
                    <span className="text-sm font-mono tracking-widest border-b border-black min-w-[100px] text-center">
                        {disbursement.control_number?.split('-').pop()}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase">Date</span>
                    <span className="text-sm border-b border-black min-w-[150px] text-center pb-0.5">
                        {formatDate(disbursement.created_at)}
                    </span>
                </div>
            </div>
            <div className="border-2 border-black flex-grow flex flex-col mt-2">
                <div className="grid grid-cols-[1fr_2.5fr_0.8fr_1fr_1fr] border-b-2 border-black font-bold text-center text-xs uppercase">
                    <div className="p-2 border-r-2 border-black">Account No.</div>
                    <div className="p-2 border-r-2 border-black tracking-[0.3em]">Particulars</div>
                    <div className="p-2 border-r-2 border-black">Ref.</div>
                    <div className="p-2 border-r-2 border-black">Debit</div>
                    <div className="p-2">Credit</div>
                </div>

                <div className="flex-grow flex flex-col bg-white">
                
                    <div className="grid grid-cols-[1fr_2.5fr_0.8fr_1fr_1fr] text-sm flex-grow">
                        <div className="border-r-2 border-black flex flex-col">
                            {disbursement.items?.map((item) => (
                                <div key={item.id} className="p-1 px-2 text-xs font-mono">{item.account?.account_code}</div>
                            ))}
                        </div>
                        <div className="border-r-2 border-black flex flex-col">
                            {disbursement.items?.map((item) => (
                                <div key={item.id} className={`p-1 px-2 text-xs ${item.type === 'credit' ? 'pl-8' : ''}`}>
                                    {item.account?.account_name}
                                </div>
                            ))}
                        </div>
                        <div className="border-r-2 border-black flex flex-col">
                            {disbursement.items?.map((item) => (
                                <div key={item.id} className="p-1 text-center text-xs"></div>
                            ))}
                        </div>
                        <div className="border-r-2 border-black flex flex-col text-right">
                            {disbursement.items?.map((item) => (
                                <div key={item.id} className="p-1 px-2 text-xs h-6">
                                    {item.type === 'debit' ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col text-right">
                            {disbursement.items?.map((item) => (
                                <div key={item.id} className="p-1 px-2 text-xs h-6">
                                    {item.type === 'credit' ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
                                </div>
                            ))}
                        </div>
                    </div>

             
                    <div className="grid grid-cols-[1fr_2.5fr_0.8fr_1fr_1fr] border-t-2 border-black font-bold text-xs uppercase bg-gray-50/50">
                        <div className="p-2 border-r-2 border-black">TOTAL</div>
                        <div className="p-2 border-r-2 border-black"></div>
                        <div className="p-2 border-r-2 border-black"></div>
                        <div className="p-2 border-r-2 border-black text-right underline decoration-double">
                            {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="p-2 text-right underline decoration-double">
                            {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>


         
            <div className="mt-10 grid grid-cols-2 gap-x-12 gap-y-8 text-[10px] uppercase font-bold">
                <div className="space-y-6">
                    <div className="flex items-end gap-2">
                        <span className="w-24 border-r pr-2">Prepared by</span>
                        <div className="flex-grow border-b border-black h-5"></div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="w-24 border-r pr-2">Checked by</span>
                        <div className="flex-grow border-b border-black h-5"></div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="w-24 border-r pr-2">Recommended by</span>
                        <div className="flex-grow border-b border-black h-5"></div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="flex items-end gap-2">
                        <span className="w-24 border-r pr-2">Approved by</span>
                        <div className="flex-grow border-b border-black h-5"></div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="w-24 border-r pr-2">Paid by</span>
                        <div className="flex-grow border-b border-black h-5"></div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="w-24 border-r pr-2">Received by</span>
                        <div className="flex-grow border-b border-black h-5"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}