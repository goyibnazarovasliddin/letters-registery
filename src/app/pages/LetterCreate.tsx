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
import { Save, Send, ChevronLeft, X, AlertTriangle, Paperclip } from 'lucide-react';
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
import { useT } from '../contexts/LanguageContext';
import { DatePicker } from '../components/ui/DatePicker';

export function LetterCreate() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user } = useUser();
    const { t } = useT();
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    useEffect(() => {
        if (user && user.status !== 'active') {
            toast.error(t('toast.accountInactive'));
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

    // File State (new uploads pending save)
    const [xatFile, setXatFile] = useState<File | null>(null);
    const [ilovaFiles, setIlovaFiles] = useState<File[]>([]);

    // Existing files already saved on server (edit mode)
    type ExistingFile = { id: string; fileName: string };
    const [existingXat, setExistingXat] = useState<ExistingFile | null>(null);
    const [existingIlovas, setExistingIlovas] = useState<ExistingFile[]>([]);

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
            .catch(() => toast.error(t('toast.indicesLoadError')));

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
                toast.error(t('toast.onlyDraftEdit'));
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

            // Track existing files (cannot be loaded as File objects, displayed as references)
            const xat = (letter as any).files?.xat;
            const ilovas = (letter as any).files?.ilova || [];
            setExistingXat(xat ? { id: xat.id, fileName: xat.fileName } : null);
            setExistingIlovas(ilovas.map((f: any) => ({ id: f.id, fileName: f.fileName })));
        } catch (error) {
            toast.error(t('toast.letterLoadError'));
            navigate('/letters');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        if (field === 'letterDate') {
            const today = new Date().toISOString().split('T')[0];
            if (value > today) {
                toast.error(t('toast.futureDateError'));
                return;
            }
            if (!allowPastDates && value < today) {
                toast.error(t('toast.pastDateError'));
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

    const removeExistingXat = async () => {
        if (!existingXat) return;
        try {
            await api.files.delete(existingXat.id);
            setExistingXat(null);
            toast.success(t('toast.fileDeleted'));
        } catch (e) {
            toast.error(t('toast.fileDeleteError'));
        }
    };

    const removeExistingIlova = async (fileId: string) => {
        try {
            await api.files.delete(fileId);
            setExistingIlovas(prev => prev.filter(f => f.id !== fileId));
            toast.success(t('toast.fileDeleted'));
        } catch (e) {
            toast.error(t('toast.fileDeleteError'));
        }
    };

    const downloadExistingFile = async (fileId: string) => {
        try {
            await api.files.download(fileId);
        } catch (e) {
            toast.error(t('toast.downloadError'));
        }
    };

    const handleSubmit = async (status: 'DRAFT' | 'REGISTERED') => {
        // Validation
        if (status === 'REGISTERED') {
            if (!formData.indexId || !formData.recipient || !formData.subject) {
                toast.error(t('toast.requiredFields'));
                return;
            }
        } else {
            // For drafts, check if at least something is entered
            const hasData = formData.indexId || formData.recipient || formData.subject || formData.summary || xatFile || ilovaFiles.length > 0;
            if (!hasData) {
                toast.error(t('toast.atLeastOneField'));
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
                    registeredAt: response.registeredAt || response.updatedDate
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
            toast.error(t('toast.genericError'));
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
                    <h2 className="text-2xl font-bold">{isEditMode ? t('letterCreate.titleEdit') : t('letterCreate.title')}</h2>
                    <p className="text-gray-500 text-sm">{isEditMode ? t('letterCreate.subEdit') : t('letterCreate.sub')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('letterCreate.indexRequired')} <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={(v) => handleInputChange('indexId', v)} value={formData.indexId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('letterCreate.selectIndex')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {indices.map(i => (
                                                <SelectItem key={i.id} value={i.id}>{i.code} - {i.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('letter.date')}</Label>
                                    <DatePicker
                                        value={formData.letterDate}
                                        onChange={(v) => handleInputChange('letterDate', v)}
                                        max={new Date().toISOString().split('T')[0]}
                                        disabled={!allowPastDates}
                                        className={!allowPastDates ? 'bg-gray-50 dark:bg-gray-900 opacity-80' : ''}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('letterCreate.recipientRequired')} <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder={t('letterCreate.recipientPlaceholder')}
                                    value={formData.recipient}
                                    readOnly
                                    className="bg-gray-50 dark:bg-gray-900"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('letterCreate.subjectRequired')} <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder={t('letterCreate.subjectPlaceholder')}
                                    value={formData.subject}
                                    onChange={(e) => handleInputChange('subject', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('letterCreate.summary')}</Label>
                                <Textarea
                                    placeholder={t('letterCreate.summaryPlaceholder')}
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
                                <h3 className="font-medium mb-4">{t('letterCreate.xatFile')} <span className="text-gray-400 text-sm font-normal">({t('common.optional')})</span></h3>
                                {existingXat && !xatFile && (
                                    <div className="flex items-center justify-between p-3 mb-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <button
                                            type="button"
                                            onClick={() => downloadExistingFile(existingXat.id)}
                                            className="flex items-center gap-2 min-w-0 flex-1 text-left hover:underline"
                                        >
                                            <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span className="text-sm truncate text-blue-700 dark:text-blue-300">{existingXat.fileName}</span>
                                            <span className="text-xs text-blue-500/70 shrink-0">({t('letterCreate.uploaded')})</span>
                                        </button>
                                        <Button variant="ghost" size="sm" onClick={removeExistingXat} className="text-red-500 hover:text-red-600 h-8 w-8 p-0 shrink-0">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                                {!existingXat && (
                                    <FileUpload
                                        label={t('letterCreate.xatFileUpload')}
                                        file={xatFile ? { name: xatFile.name, size: xatFile.size } : undefined}
                                        onFileSelect={handleFileSelect}
                                        onRemove={() => setXatFile(null)}
                                    />
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-medium mb-4">{t('letterCreate.ilovaFiles')} <span className="text-gray-400 text-sm font-normal">({t('common.optional')})</span></h3>
                                <div className="space-y-3">
                                    {existingIlovas.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <button
                                                type="button"
                                                onClick={() => downloadExistingFile(file.id)}
                                                className="flex items-center gap-2 min-w-0 flex-1 text-left hover:underline"
                                            >
                                                <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="text-sm truncate text-blue-700 dark:text-blue-300">{file.fileName}</span>
                                                <span className="text-xs text-blue-500/70 shrink-0">({t('letterCreate.uploaded')})</span>
                                            </button>
                                            <Button variant="ghost" size="sm" onClick={() => removeExistingIlova(file.id)} className="text-red-500 hover:text-red-600 h-8 w-8 p-0 shrink-0">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {ilovaFiles.map((file, idx) => (
                                        <div key={`new-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                                        label={t('letterCreate.ilovaAdd')}
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
                            <h3 className="font-medium">{t('letterCreate.pageCounts')}</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('letterCreate.letterPages')}</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.letterPages}
                                        onChange={(e) => handleInputChange('letterPages', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('letterCreate.attachmentPages')}</Label>
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
                            className="w-full bg-green-600 hover:bg-green-700 text-white dark:text-white py-6 text-lg"
                            onClick={() => handleSubmit('REGISTERED')}
                            disabled={loading}
                        >
                            <Send className="w-5 h-5 mr-2" />
                            {t('letterCreate.register')}
                        </Button>
                        <Button
                            variant="default"
                            className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white dark:text-white"
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={loading}
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {t('letterCreate.saveDraft')}
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
                            {t('letterCreate.unsavedTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('letterCreate.unsavedSub')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white dark:text-white"
                            onClick={() => handleSubmit('REGISTERED')}
                            disabled={loading}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {t('letterCreate.register')}
                        </Button>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:text-white"
                            onClick={() => handleSubmit('DRAFT')}
                            disabled={loading}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {t('letterCreate.saveDraft')}
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => blocker.reset!()}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => blocker.proceed!()}
                            >
                                {t('common.discard')}
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

