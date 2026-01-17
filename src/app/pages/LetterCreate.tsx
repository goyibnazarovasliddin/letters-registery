import React, { useState, useEffect } from 'react';
import { useNavigate, useBlocker, useParams } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { api } from '../services/api/client';
import { useUser } from '../contexts/UserContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { FileUpload } from '../components/ui/FileUpload';
import { toast } from 'sonner';
import { Save, Send, ChevronLeft, X, AlertTriangle, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { SuccessModal } from '../components/SuccessModal';

export function LetterCreate() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    useEffect(() => {
        if (user && user.status !== 'active') {
            toast.error("Hisobingiz faol emas, xat yarata olmaysiz");
            navigate('/');
        }
    }, [user, navigate]);

    // Check if we're in edit mode
    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            fetchLetterData(id);
        }
    }, [id]);

    // Form State
    const [formData, setFormData] = useState({
        recipient: '',
        subject: '',
        summary: '',
        letterPages: 1,
        attachmentPages: 0,
        indexId: '',
        letterDate: new Date().toISOString().split('T')[0]
    });

    // File State
    const [xatFile, setXatFile] = useState<File | null>(null);
    const [ilovaFiles, setIlovaFiles] = useState<File[]>([]);

    // Indices State
    const [indices, setIndices] = useState<{ id: string, code: string, name: string, status: string }[]>([]);

    // Settings State
    const [allowPastDates, setAllowPastDates] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const isDirty = (
        formData.recipient !== '' ||
        formData.subject !== '' ||
        formData.summary !== '' ||
        formData.indexId !== '' ||
        xatFile !== null ||
        ilovaFiles.length > 0
    );

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        api.indices.list()
            .then(data => {
                // Only show active indices to users
                const active = data.filter((i: any) => i.status === 'active');
                setIndices(active);
            })
            .catch(() => toast.error('Indekslarni yuklab bo\'lmadi'));

        api.settings.get()
            .then(res => {
                if (res) setAllowPastDates(res.allowPastDates);
            })
            .catch(() => console.error("Settings error"));
    }, []);

    // Fetch existing letter data for edit mode
    const fetchLetterData = async (letterId: string) => {
        try {
            setLoading(true);
            const letter = await api.letters.get(letterId);

            if (letter.status !== 'DRAFT') {
                toast.error('Faqat qoralamalarni tahrirlash mumkin');
                navigate('/letters');
                return;
            }

            // Pre-fill form data
            setFormData({
                recipient: letter.recipient,
                subject: letter.subject,
                summary: letter.summary || '',
                letterPages: letter.pageCount,
                attachmentPages: letter.attachmentPageCount,
                indexId: letter.indexId,
                letterDate: new Date(letter.letterDate).toISOString().split('T')[0]
            });

            // Note: Files cannot be pre-filled in browser for security reasons
            // User will need to re-upload files if they want to change them
        } catch (error) {
            toast.error('Xatni yuklashda xatolik');
            navigate('/letters');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        if (field === 'letterDate') {
            const today = new Date().toISOString().split('T')[0];
            if (value > today) {
                toast.error("Kelajak sanasini tanlash mumkin emas");
                return;
            }
            if (!allowPastDates && value < today) {
                toast.error("O'tgan sanani tanlash taqiqlangan");
                return;
            }
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Force date to today if allowPastDates is disabled
    useEffect(() => {
        if (!allowPastDates) {
            setFormData(prev => ({ ...prev, letterDate: new Date().toISOString().split('T')[0] }));
        }
    }, [allowPastDates]);

    // Auto-fill recipient when index is selected
    useEffect(() => {
        if (formData.indexId) {
            const selectedIndex = indices.find(i => i.id === formData.indexId);
            if (selectedIndex) {
                setFormData(prev => ({ ...prev, recipient: selectedIndex.name }));
            }
        }
    }, [formData.indexId, indices]);

    const handleFileSelect = async (file: File) => {
        setXatFile(file);
    };

    const handleIlovaSelect = async (file: File) => {
        setIlovaFiles(prev => [...prev, file]);
    };

    const removeIlova = (index: number) => {
        setIlovaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (status: 'DRAFT' | 'REGISTERED') => {
        // Validation
        if (status === 'REGISTERED') {
            if (!formData.indexId || !formData.recipient || !formData.subject) {
                toast.error('Ro\'yxatga olish uchun majburiy maydonlarni to\'ldiring');
                return;
            }
        } else {
            // For drafts, check if at least something is entered
            const hasData = formData.indexId || formData.recipient || formData.subject || formData.summary || xatFile || ilovaFiles.length > 0;
            if (!hasData) {
                toast.error("Saqlash uchun kamida biror ma'lumot kiriting");
                return;
            }
        }

        setLoading(true);
        setIsSubmitting(true);
        try {
            let response;
            if (isEditMode && id) {
                // Update existing draft
                response = await api.letters.update(id, {
                    ...formData,
                    status,
                    xatFile: xatFile,
                    ilovaFiles: ilovaFiles
                });
            } else {
                // Create new letter
                response = await api.letters.create({
                    ...formData,
                    status,
                    xatFile: xatFile,
                    ilovaFiles: ilovaFiles
                });
            }

            if (status === 'REGISTERED') {
                console.log('Register Response:', response);
                // Show Success Modal
                setSuccessData({
                    id: response.id,
                    letterNumber: response.letterNumber,
                    letterDate: response.letterDate,
                    createdAt: response.createdDate
                });
                setShowSuccessModal(true);
                // Don't navigate yet, modal handles it
                // But we should reset blocker state so it doesn't prompt when navigating from modal
                if (blocker.state === 'blocked') {
                    blocker.reset!();
                }
            } else {
                toast.success(isEditMode ? 'Qoralama yangilandi' : 'Qoralama saqlandi');
                // If blocker is active, we need to handle it
                if (blocker.state === 'blocked') {
                    blocker.proceed!();
                } else {
                    navigate('/letters');
                }
            }

        } catch (e) {
            console.error(e);
            toast.error('Xatolik yuz berdi');
            setIsSubmitting(false);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/letters')}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">{isEditMode ? 'Xatni tahrirlash' : 'Yangi xat yaratish'}</h2>
                    <p className="text-gray-500 text-sm">{isEditMode ? 'Qoralamani tahrirlash' : 'Chiquvchi xatni ro\'yxatga olish'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Indeks <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={(v) => handleInputChange('indexId', v)} value={formData.indexId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tanlang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {indices.map(i => (
                                                <SelectItem key={i.id} value={i.id}>{i.code} - {i.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Sana</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white" />
                                        <Input
                                            type="date"
                                            value={formData.letterDate}
                                            onChange={(e) => handleInputChange('letterDate', e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            readOnly={!allowPastDates}
                                            className={`pl-10 datepicker-light ${!allowPastDates ? 'bg-gray-50 cursor-not-allowed opacity-80' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Qabul qiluvchi <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="Indeksni tanlang"
                                    value={formData.recipient}
                                    readOnly
                                    className="bg-gray-50 dark:bg-gray-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Mavzu <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="Xat mazmuni qisqacha"
                                    value={formData.subject}
                                    onChange={(e) => handleInputChange('subject', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Qisqacha mazmuni</Label>
                                <Textarea
                                    placeholder="Qo'shimcha izohlar..."
                                    className="h-24 resize-none"
                                    value={formData.summary}
                                    onChange={(e) => handleInputChange('summary', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <h3 className="font-medium mb-4">Xat fayli <span className="text-gray-400 text-sm font-normal">(ixtiyoriy)</span></h3>
                                <FileUpload
                                    label="Asosiy hujjatni yuklang"
                                    file={xatFile ? { name: xatFile.name, size: xatFile.size } : undefined}
                                    onFileSelect={handleFileSelect}
                                    onRemove={() => setXatFile(null)}
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-medium mb-4">Ilova fayllar <span className="text-gray-400 text-sm font-normal">(ixtiyoriy)</span></h3>
                                <div className="space-y-3">
                                    {ilovaFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded text-gray-600 dark:text-gray-400">FILE</div>
                                                <span className="text-sm truncate max-w-xs dark:text-gray-200">{file.name}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeIlova(idx)} className="text-red-500 hover:text-red-600 dark:hover:bg-gray-700 h-8 w-8 p-0">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <FileUpload
                                        label="Ilova qo'shish (Fayl tanlang)"
                                        onFileSelect={handleIlovaSelect}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar / Meta */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-medium">Sahifalar soni</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label>Xat varaqlari</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.letterPages}
                                        onChange={(e) => handleInputChange('letterPages', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ilova varaqlari</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.attachmentPages}
                                        onChange={(e) => handleInputChange('attachmentPages', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg shadow-lg shadow-green-600/20 transition-all hover:scale-[1.02]"
                            onClick={() => handleSubmit('REGISTERED')}
                            disabled={loading}
                        >
                            <Send className="w-5 h-5 mr-2" />
                            Ro'yxatga olish
                        </Button>
                        <Button
                            variant="default"
                            className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={loading}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Qoralamaga saqlash
                        </Button>
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Blocker Dialog */}
            <AlertDialog open={blocker.state === 'blocked'}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-5 h-5" />
                            Saqlanmagan o'zgarishlar
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Sizda saqlanmagan ma'lumotlar bor. Sahifadan chiqishdan oldin ularni saqlashni xohlaysizmi?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleSubmit('REGISTERED')}
                            disabled={loading}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Ro'yxatga olish
                        </Button>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={loading}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Qoralamaga saqlash
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => blocker.reset!()}
                            >
                                Bekor qilish
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => blocker.proceed!()}
                            >
                                Saqlamasdan chiqish
                            </Button>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <SuccessModal
                open={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate('/letters');
                }}
                onViewLetter={() => {
                    if (successData?.id) {
                        navigate(`/letters/${successData.id}`);
                    }
                }}
                data={successData}
            />
        </div>
    );
}

