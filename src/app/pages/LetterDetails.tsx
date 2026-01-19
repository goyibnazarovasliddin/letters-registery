import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api/client';
import { LetterDTO } from '../types/portal';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ChevronLeft, Calendar, FileText, User, Download, File, Send, LayoutDashboard, List, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime, formatDate } from '../utils/formatters';
import { SuccessModal } from '../components/SuccessModal';

export function LetterDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [letter, setLetter] = useState<LetterDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    const from = location.state?.from;

    useEffect(() => {
        if (id) fetchLetter(id);
    }, [id]);

    const fetchLetter = async (id: string) => {
        try {
            const data = await api.letters.get(id);
            setLetter(data || null);
        } catch (e) {
            toast.error('Xatni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        // STRICT NAVIGATION: Always go to /letters
        navigate('/letters');
    };


    const handleRegister = async () => {
        if (!letter) return;

        // Validation for registration
        if (!letter.indexCode && !letter.indexName) {
            toast.error('Ro\'yxatga olish uchun indeks tanlanishi shart');
            return;
        }
        if (!letter.recipient) {
            toast.error('Ro\'yxatga olish uchun qabul qiluvchi kiritilishi shart');
            return;
        }
        if (!letter.subject) {
            toast.error('Ro\'yxatga olish uchun mavzu kiritilishi shart');
            return;
        }

        setRegistering(true);
        try {
            const response = await api.letters.register(letter.id);
            // Show success modal with registered letter data
            setSuccessData({
                id: response.id,
                letterNumber: response.letterNumber,
                letterDate: response.letterDate,
                registeredAt: response.registeredAt || response.updatedDate
            });
            setShowSuccessModal(true);
        } catch (e) {
            toast.error('Ro\'yxatga olishda xatolik');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <div>Yuklanmoqda...</div>;
    if (!letter) return <div>Xat topilmadi</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
            {/* Breadcrumb / Source Indicator */}
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                {from === 'dashboard' ? (
                    <>
                        <LayoutDashboard className="w-4 h-4 mr-1" />
                        <span>Dashboard</span>
                    </>
                ) : (
                    <>
                        <List className="w-4 h-4 mr-1" />
                        <span>Mening xatlarim</span>
                    </>
                )}
                <span className="mx-2">/</span>
                <span className="truncate max-w-[200px]">Xat</span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold dark:text-gray-100">
                                    Xat tafsilotlari
                                </h2>
                                <Badge variant={letter.status === 'REGISTERED' ? 'default' : 'secondary'} className={letter.status === 'REGISTERED' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}>
                                    {letter.status === 'REGISTERED' ? 'Ro\'yxatga olingan' : 'Qoralama'}
                                </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Ro'yxatga olingan vaqt: {formatDateTime(letter.status === 'REGISTERED' ? (letter.registeredAt || letter.updatedDate) : letter.updatedDate)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {letter.status === 'DRAFT' && (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/letters/edit/${letter.id}`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Tahrirlash
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={handleRegister} disabled={registering}>
                                <Send className="w-4 h-4 mr-2" />
                                Ro'yxatga olish
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={() => window.print()}>
                        Chop etish
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Mavzu</h3>
                                <p className="text-lg font-medium">{letter.subject || <span className="text-gray-400 italic font-normal">Kiritilmagan</span>}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Qabul qiluvchi</h3>
                                    <p className="flex items-center gap-2"><BuildingIcon className="w-4 h-4 text-gray-400" /> {letter.recipient || <span className="text-gray-400 italic">Kiritilmagan</span>}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Sana</h3>
                                    <p className="flex items-center gap-2 dark:text-gray-300"><Calendar className="w-4 h-4 text-gray-400 dark:text-white" /> {formatDate(letter.letterDate)}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Qisqacha mazmuni</h3>
                                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    {letter.summary || "Mazmun kiritilmagan"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Files Section */}
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-semibold text-lg">Biriktirilgan fayllar</h3>
                    </div>
                    <div className="space-y-3">
                        {!letter.files.xat && (!letter.files.ilova || letter.files.ilova.length === 0) ? (
                            <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed rounded-lg p-8 text-center">
                                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2 opacity-50" />
                                <p className="text-gray-500 dark:text-gray-400 text-sm italic">Fayllar biriktirilmagan</p>
                            </div>
                        ) : (
                            <>
                                {letter.files.xat && (
                                    <div className="bg-white dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm dark:text-gray-200">{letter.files.xat.fileName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Asosiy xat • {(letter.files.xat.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => api.files.download(letter.files.xat!.id)} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                                            <Download className="w-4 h-4 mr-2" /> Yuklab olish
                                        </Button>
                                    </div>
                                )}

                                {letter.files.ilova && letter.files.ilova.map(file => (
                                    <div key={file.id} className="bg-white dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg p-4 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm dark:text-gray-200">{file.fileName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Ilova • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => api.files.download(file.id)} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                                            <Download className="w-4 h-4 mr-2" /> Yuklab olish
                                        </Button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-medium border-b pb-2">Ijrochi ma'lumotlari</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{letter.userFish}</p>
                                    <p className="text-xs text-gray-500">{letter.userPosition}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-medium border-b pb-2">Hujjat parametrlari</h3>
                            <div className="space-y-3 text-sm">
                                {letter.letterNumber && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Xat raqami:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold font-mono text-green-600 dark:text-green-400">{letter.letterNumber}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(letter.letterNumber || '');
                                                    toast.success("Nusxalandi");
                                                }}
                                            >
                                                <FileText className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Indeks:</span>
                                    <span className="font-medium">{letter.indexCode ? `${letter.indexCode} - ${letter.indexName}` : <span className="text-gray-400 italic font-normal">Kiritilmagan</span>}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Xat varaqlari:</span>
                                    <span className="font-medium">{letter.pageCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ilova varaqlari:</span>
                                    <span className="font-medium">{letter.attachmentPageCount}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <SuccessModal
                open={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate('/letters');
                }}
                onViewLetter={() => {
                    if (successData?.id) {
                        setShowSuccessModal(false);
                        fetchLetter(successData.id); // Refresh to show new status
                    }
                }}
                data={successData}
            />
        </div >
    );
}

function BuildingIcon({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /></svg>;
}
