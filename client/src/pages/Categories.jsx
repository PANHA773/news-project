import { useEffect, useState } from "react";
import api from "../api/axios";
import { Plus, Trash, Tag, Edit, PenLine, ShieldAlert, Globe, Cpu, Activity, Heart, Music, Film, Mic, Briefcase, GraduationCap, FlaskConical, Gamepad2, Utensils, Plane, Home } from "lucide-react";

// Icon mapping
const iconMap = {
    Tag, Globe, Cpu, Activity, Heart, Music, Film, Mic, Briefcase, GraduationCap, FlaskConical, Gamepad2, Utensils, Plane, Home
};

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("Tag");
    const [deleteConfirmCategory, setDeleteConfirmCategory] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/categories");
            setCategories(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching categories", error);
            setLoading(false);
        }
    };

    const openModal = (category = null) => {
        setEditingCategory(category);
        setName(category ? category.name : "");
        setSelectedIcon(category ? (category.icon || "Tag") : "Tag");
        setShowModal(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory._id}`, { name, icon: selectedIcon });
            } else {
                await api.post("/categories", { name, icon: selectedIcon });
            }
            setShowModal(false);
            setName("");
            setSelectedIcon("Tag");
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category", error);
        }
    };

    const confirmDelete = (category) => {
        setDeleteConfirmCategory(category);
    };

    const handleDelete = async () => {
        if (!deleteConfirmCategory) return;
        try {
            await api.delete(`/categories/${deleteConfirmCategory._id}`);
            setDeleteConfirmCategory(null);
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category", error);
            setDeleteConfirmCategory(null);
        }
    };

    const DeleteConfirmModal = ({ category, onConfirm, onCancel }) => {
        if (!category) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
                <div
                    className="bg-[#0f0f1a] rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] max-w-md w-full p-8 animate-scale-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Warning Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-red-500/10 rounded-full border-2 border-red-500/30">
                            <ShieldAlert className="w-12 h-12 text-red-500" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white text-center mb-3">
                        Delete Category?
                    </h2>

                    {/* Message */}
                    <p className="text-gray-400 text-center mb-2">
                        Are you sure you want to delete the category <span className="text-white font-bold">{category.name}</span>?
                    </p>
                    <p className="text-red-400 text-sm text-center mb-8 font-medium">
                        This action cannot be undone.
                    </p>

                    {/* Category Info Card */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                        <div className="flex items-center gap-3 justify-center">
                            <div className="p-3 bg-(--primary-glow)/10 rounded-lg text-(--primary-glow)">
                                <Tag className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">{category.name}</p>
                                <p className="text-gray-500 text-xs">Category</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                        >
                            Delete Category
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Helper to render dynamic icon
    const renderIcon = (iconName, className = "w-4 h-4") => {
        const IconComponent = iconMap[iconName] || Tag;
        return <IconComponent className={className} />;
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold glow-text text-white">Categories</h2>
                    <p className="text-gray-400 mt-1">Organize news content with tags.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-6 py-2.5 text-black bg-(--primary-glow) rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all font-bold"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Category
                </button>
            </div>

            <div className="glass-card rounded-xl shadow-lg border border-[rgba(255,255,255,0.05)] overflow-hidden">
                <table className="w-full whitespace-nowrap text-left">
                    <thead className="bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.05)]">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-(--secondary-glow) uppercase tracking-wider">Category Name</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-(--secondary-glow) uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                        {loading ? (
                            <tr><td colSpan="2" className="text-center py-8 text-gray-500">Loading categories...</td></tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category._id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors group">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-200 flex items-center gap-3">
                                        <div className="p-2 bg-[rgba(0,243,255,0.1)] rounded-lg text-(--primary-glow) group-hover:glow-text">
                                            {renderIcon(category.icon)}
                                        </div>
                                        {category.name}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                                        <button onClick={() => openModal(category)} className="text-gray-500 hover:text-(--primary-glow) transition-colors p-2 hover:bg-[rgba(0,243,255,0.1)] rounded-lg">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => confirmDelete(category)} className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-lg">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-fade-in-up border border-[rgba(255,255,255,0.1)]">
                        <div className="px-8 py-6 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
                            <h3 className="text-xl font-bold text-white tracking-wide glow-text">{editingCategory ? "Edit Category" : "New Category"}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-1">Category Name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg focus:ring-1 focus:ring-(--primary-glow) focus:border-(--primary-glow) transition-all outline-none" placeholder="e.g. Science" required />
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Icon</label>
                                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {Object.keys(iconMap).map((iconKey) => {
                                        const IconComponent = iconMap[iconKey];
                                        return (
                                            <button
                                                key={iconKey}
                                                type="button"
                                                onClick={() => setSelectedIcon(iconKey)}
                                                className={`p-2 rounded-lg flex items-center justify-center transition-all ${selectedIcon === iconKey ? 'bg-(--primary-glow) text-black shadow-[0_0_10px_rgba(0,243,255,0.5)]' : 'bg-[rgba(255,255,255,0.05)] text-gray-400 hover:bg-[rgba(255,255,255,0.1)] hover:text-white'}`}
                                            >
                                                <IconComponent className="w-5 h-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium text-gray-400 bg-transparent border border-[rgba(255,255,255,0.1)] rounded-lg hover:bg-[rgba(255,255,255,0.05)]">Cancel</button>
                                <button type="submit" className="px-5 py-2 text-sm font-bold text-black bg-(--primary-glow) rounded-lg hover:brightness-110 shadow-[0_0_10px_rgba(0,243,255,0.3)]">
                                    {editingCategory ? "Update" : "Save"} Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirmCategory && (
                <DeleteConfirmModal
                    category={deleteConfirmCategory}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteConfirmCategory(null)}
                />
            )}
        </div>
    );
};

export default Categories;
