import { useState, useContext, useEffect } from "react";
import { Settings as SettingsIcon, Bell, Moon, Sun, Shield, User, Globe, HelpCircle, Save, Archive, Download, Upload, ShieldAlert } from "lucide-react";
import AuthContext from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import api from "../api/axios";

const Settings = () => {
    const { user, updateProfile } = useContext(AuthContext);
    const notify = useNotification();
    const [loading, setLoading] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const handleDownloadBackup = async () => {
        setBackupLoading(true);
        try {
            const response = await api.get('/backup');
            const dataStr = JSON.stringify(response.data, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify.success("Backup downloaded successfully");
        } catch (error) {
            console.error("Download Error:", error);
            notify.error("Failed to download backup");
        } finally {
            setBackupLoading(false);
        }
    };

    const handleRestoreBackup = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("Are you sure you want to restore data? This will REPLACE all current data!")) {
            e.target.value = null; // Reset input
            return;
        }

        setRestoreLoading(true);
        const formData = new FormData();
        formData.append('backup', file);

        try {
            await api.post('/backup/restore', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notify.success("Data restored successfully! The page will reload.");
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error("Restore Error:", error);
            notify.error(error.response?.data?.message || "Failed to restore data");
        } finally {
            setRestoreLoading(false);
            e.target.value = null;
        }
    };

    // Settings state initialized from user context
    const [darkMode, setDarkMode] = useState(user?.settings?.darkMode ?? true);
    const [emailNotifications, setEmailNotifications] = useState(user?.settings?.emailNotifications ?? true);
    const [pushNotifications, setPushNotifications] = useState(user?.settings?.pushNotifications ?? true);
    const [language, setLanguage] = useState(user?.settings?.language ?? "English");

    // Sync theme on mount
    useEffect(() => {
        if (user?.settings?.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [user]);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                darkMode,
                emailNotifications,
                pushNotifications,
                language,
            };

            // Using the centralized api instance
            const { data } = await api.put("/users/settings", payload);

            // Update local user state
            updateProfile(data, localStorage.getItem("token"));

            // Toggle document class for theme if needed
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            notify.success("Settings updated and saved!");
        } catch (error) {
            notify.error("Failed to save settings");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const SettingSection = ({ icon: Icon, title, description, children }) => (
        <div className="glass-card p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] mb-6">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] text-(--primary-glow)">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{description}</p>
                </div>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );

    const Toggle = ({ enabled, setEnabled, label }) => (
        <div className="flex items-center justify-between py-2">
            <span className="text-gray-300 font-medium">{label}</span>
            <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? "bg-(--primary-glow)" : "bg-gray-700"
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none mb-2">
                        {language === "Khmer" ? "ការកំណត់" : "Settings"}
                    </h1>
                    <p className="text-gray-400 text-lg">
                        {language === "Khmer" ? "ប្ដូរតាមបំណងនូវបទពិសោធន៍ព័ត៌មានរបស់អ្នក។" : "Customize your news experience."}
                    </p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="flex items-center px-6 py-2.5 bg-(--primary-glow) text-black font-bold rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all disabled:opacity-50"
                >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? (language === "Khmer" ? "កំពុងរក្សាទុក..." : "Saving...") : (language === "Khmer" ? "រក្សាការផ្លាស់ប្តូរ" : "Save Changes")}
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* Visual Settings */}
                <SettingSection
                    icon={Moon}
                    title={language === "Khmer" ? "រូបរាង" : "Appearance"}
                    description={language === "Khmer" ? "ប្ដូរតាមបំណងនូវរបៀបដែលកម្មវិធីបង្ហាញជូនអ្នក។" : "Customize how the application looks for you."}
                >
                    <Toggle enabled={darkMode} setEnabled={setDarkMode} label={language === "Khmer" ? "មុខងារងងឹត" : "Dark Mode"} />
                    <div className="flex items-center justify-between py-2 border-t border-[rgba(255,255,255,0.05)] mt-2 pt-4">
                        <span className="text-gray-300 font-medium">{language === "Khmer" ? "ទំហំអក្សរ" : "Font Size"}</span>
                        <select className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-(--primary-glow)">
                            <option>{language === "Khmer" ? "តូច" : "Small"}</option>
                            <option selected>{language === "Khmer" ? "មធ្យម" : "Medium"}</option>
                            <option>{language === "Khmer" ? "ធំ" : "Large"}</option>
                        </select>
                    </div>
                </SettingSection>

                {/* Notifications */}
                <SettingSection
                    icon={Bell}
                    title={language === "Khmer" ? "ការជូនដំណឹង" : "Notifications"}
                    description={language === "Khmer" ? "ទទួលបានព័ត៌មានថ្មីៗបំផុតដោយជ្រើសរើសចំណូលចិត្តរបស់អ្នក។" : "Stay updated with the latest news by choosing your preferences."}
                >
                    <Toggle enabled={emailNotifications} setEnabled={setEmailNotifications} label={language === "Khmer" ? "ការជូនដំណឹងតាមអ៊ីមែល" : "Email Notifications"} />
                    <Toggle enabled={pushNotifications} setEnabled={setPushNotifications} label={language === "Khmer" ? "ការជូនដំណឹងនៅលើផ្ទៃតុ" : "Desktop Push Notifications"} />
                </SettingSection>

                {/* Localization */}
                <SettingSection
                    icon={Globe}
                    title={language === "Khmer" ? "ភាសា និង តំបន់" : "Language & Region"}
                    description={language === "Khmer" ? "ជ្រើសរើសភាសាដែលអ្នកចូលចិត្តសម្រាប់ព័ត៌មានសាកលវិទ្យាល័យ។" : "Select your preferred language for the campus news."}
                >
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-300 font-medium">{language === "Khmer" ? "ភាសាកម្មវិធី" : "App Language"}</span>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-(--primary-glow)"
                        >
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                            <option>Khmer</option>
                        </select>
                    </div>
                </SettingSection>

                {/* Security */}
                <SettingSection
                    icon={Shield}
                    title={language === "Khmer" ? "សុវត្ថិភាព និង ឯកជនភាព" : "Security & Privacy"}
                    description={language === "Khmer" ? "គ្រប់គ្រងការមើលឃើញគណនី និងទិន្នន័យសុវត្ថិភាពរបស់អ្នក។" : "Control your account visibility and security data."}
                >
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-300 font-medium">{language === "Khmer" ? "ស្ថានភាពគណនី" : "Account Status"}</span>
                        <span className="text-(--primary-glow) text-sm font-bold bg-[rgba(0,243,255,0.1)] px-3 py-1 rounded-full border border-[rgba(0,243,255,0.2)]">{language === "Khmer" ? "សកម្ម" : "Active"}</span>
                    </div>
                </SettingSection>

                {/* Data Management (Admin Only) */}
                {user?.role === 'admin' && (
                    <SettingSection
                        icon={Archive}
                        title={language === "Khmer" ? "ការគ្រប់គ្រងទិន្នន័យ" : "Data Management"}
                        description={language === "Khmer" ? "បម្រុងទុក និងស្ដារទិន្នន័យមូលដ្ឋានទិន្នន័យ។" : "Backup and restore database data."}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-300 font-medium">{language === "Khmer" ? "ទាញយកឯកសារបម្រុងទុក" : "Download Backup"}</span>
                                <button
                                    onClick={handleDownloadBackup}
                                    disabled={loading || backupLoading}
                                    className="flex items-center px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg transition-all"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    {backupLoading ? "Downloading..." : "Export Data"}
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-2 border-t border-[rgba(255,255,255,0.05)]">
                                <span className="text-gray-300 font-medium">{language === "Khmer" ? "ស្ដារទិន្នន័យ" : "Restore Data"}</span>
                                <div>
                                    <input
                                        type="file"
                                        id="restore-upload"
                                        className="hidden"
                                        accept=".json"
                                        onChange={handleRestoreBackup}
                                    />
                                    <label
                                        htmlFor="restore-upload"
                                        className={`flex items-center px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg transition-all cursor-pointer ${restoreLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {restoreLoading ? "Restoring..." : "Import Data"}
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-red-400 mt-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <ShieldAlert className="w-4 h-4 inline mr-1 mb-0.5" />
                                <strong>Warning:</strong> Restoring data will replace all current data. Make sure to backup before restoring.
                            </p>
                        </div>
                    </SettingSection>
                )}

                {/* Help */}
                <div className="flex items-center justify-center gap-6 py-10 opacity-50">
                    <button className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Help Center
                    </button>
                    <button className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                        <User className="w-4 h-4 mr-2" />
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;

