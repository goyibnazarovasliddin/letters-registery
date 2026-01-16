import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Save, Send, ChevronLeft, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function LetterCreate() {
    const navigate = useNavigate();
    // const { indices } = useAdmin(); // duplicate removed // Use indices from admin context for now or move to user context
    const { user } = useUser();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && user.status !== 'active') {
            toast.error("Hisobingiz faol emas, xat yarata olmaysiz");
            navigate('/');
        }
    }, [user, navigate]);

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

    useEffect(() => {
        api.indices.list()
            .then(data => {
                // Only show active indices to users
                const active = data.filter((i: any) => i.status === 'active');
                setIndices(active);
            })
            .catch(() => toast.error('Indekslarni yuklab bo\'lmadi'));
    }, []);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

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
        if (!formData.indexId || !formData.recipient || !formData.subject) {
            toast.error('Majburiy maydonlarni to\'ldiring');
            return;
        }

        if (!xatFile) {
            toast.error('Xat faylini yuklash majburiy');
            return;
        }

        setLoading(true);
        try {
            await api.letters.create({
                ...formData,
                status,
                xatFile: xatFile,
                ilovaFiles: ilovaFiles
            });

            toast.success(status === 'REGISTERED' ? 'Xat muvaffaqiyatli ro\'yxatga olindi' : 'Qoralama saqlandi');
            navigate('/letters');
        } catch (e) {
            console.error(e);
            toast.error('Xatolik yuz berdi');
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
                    <h2 className="text-2xl font-bold">Yangi xat yaratish</h2>
                    <p className="text-gray-500 text-sm">Chiquvchi xatni ro'yxatga olish</p>
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
                                    <Input
                                        type="date"
                                        value={formData.letterDate}
                                        onChange={(e) => handleInputChange('letterDate', e.target.value)}
                                        min={user?.settings?.allowBackdatedLetters ? undefined : new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Qabul qiluvchi <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="Tashkilot nomi yoki F.I.Sh"
                                    value={formData.recipient}
                                    onChange={(e) => handleInputChange('recipient', e.target.value)}
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
                                <h3 className="font-medium mb-4">Xat fayli <span className="text-red-500">*</span></h3>
                                <FileUpload
                                    label="Asosiy hujjatni yuklang (PDF)"
                                    file={xatFile ? { name: xatFile.name, size: xatFile.size } : undefined}
                                    onFileSelect={handleFileSelect}
                                    onRemove={() => setXatFile(null)}
                                    accept={{ 'application/pdf': ['.pdf'] }}
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-medium mb-4">Ilova fayllar</h3>
                                <div className="space-y-3">
                                    {ilovaFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-gray-200 p-2 rounded">DOC</div>
                                                <span className="text-sm truncate max-w-xs">{file.name}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => removeIlova(idx)} className="text-red-500 h-8 w-8 p-0">
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
                            variant="outline"
                            className="w-full py-6 text-gray-600"
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={loading}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Qoralamaga saqlash
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
