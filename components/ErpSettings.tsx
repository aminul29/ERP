


import React, { useState } from 'react';
import { ErpSettings as ErpSettingsType, Theme, ColorScheme } from '../types';
import { Card } from './ui/Card';
import { ICONS } from '../constants';

interface ErpSettingsProps {
    settings: ErpSettingsType;
    onSettingsChange: (newSettings: ErpSettingsType) => void;
}

export const ErpSettings: React.FC<ErpSettingsProps> = ({ settings, onSettingsChange }) => {
    const [localSettings, setLocalSettings] = useState<ErpSettingsType>(settings);
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const [newDivision, setNewDivision] = useState('');
    const [newRole, setNewRole] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setLocalSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };
    
    const handleAddDivision = () => {
        if (newDivision && !localSettings.divisions.includes(newDivision)) {
            setLocalSettings(prev => ({
                ...prev,
                divisions: [...prev.divisions, newDivision.trim()]
            }));
            setNewDivision('');
        }
    };

    const handleDeleteDivision = (divisionToDelete: string) => {
        setLocalSettings(prev => ({
            ...prev,
            divisions: prev.divisions.filter(d => d !== divisionToDelete)
        }));
    };

    const handleAddRole = () => {
        if (newRole && !localSettings.roles.includes(newRole)) {
            setLocalSettings(prev => ({
                ...prev,
                roles: [...prev.roles, newRole.trim()]
            }));
            setNewRole('');
        }
    };

    const handleDeleteRole = (roleToDelete: string) => {
        setLocalSettings(prev => ({
            ...prev,
            roles: prev.roles.filter(r => r !== roleToDelete)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSettingsChange(localSettings);
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">ERP Settings</h1>
            <Card>
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`py-2 px-4 font-medium text-sm transition-colors ${
                            activeTab === 'general'
                                ? 'border-b-2 border-primary-500 text-primary-500'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('customization')}
                        className={`py-2 px-4 font-medium text-sm transition-colors ${
                            activeTab === 'customization'
                                ? 'border-b-2 border-primary-500 text-primary-500'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        Customization
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Company Name */}
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Company Name</label>
                                    <input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        value={localSettings.companyName}
                                        onChange={handleChange}
                                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                        required
                                    />
                                </div>

                                {/* Daily Time Goal */}
                                <div>
                                    <label htmlFor="dailyTimeGoal" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Daily Time Goal (Hours)</label>
                                    <input
                                        id="dailyTimeGoal"
                                        name="dailyTimeGoal"
                                        type="number"
                                        value={localSettings.dailyTimeGoal}
                                        onChange={handleChange}
                                        step="0.5"
                                        min="1"
                                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                        required
                                    />
                                </div>

                                {/* Currency Symbol */}
                                <div>
                                    <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Currency Symbol</label>
                                    <input
                                        id="currencySymbol"
                                        name="currencySymbol"
                                        type="text"
                                        value={localSettings.currencySymbol}
                                        onChange={handleChange}
                                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                        required
                                    />
                                </div>

                                {/* Theme */}
                                <div>
                                    <label htmlFor="theme" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Application Theme</label>
                                    <select
                                        id="theme"
                                        name="theme"
                                        value={localSettings.theme}
                                        onChange={handleChange}
                                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 capitalize"
                                        required
                                    >
                                        {Object.values(Theme).map(themeValue => (
                                            <option key={themeValue} value={themeValue} className="capitalize">
                                                {themeValue}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Color Scheme */}
                                <div className="md:col-span-2">
                                    <label htmlFor="colorScheme" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Color Scheme</label>
                                    <select
                                        id="colorScheme"
                                        name="colorScheme"
                                        value={localSettings.colorScheme}
                                        onChange={handleChange}
                                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 capitalize"
                                        required
                                    >
                                        {Object.values(ColorScheme).map(color => (
                                            <option key={color} value={color} className="capitalize">
                                                {color}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'customization' && (
                        <div className="space-y-8">
                             <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Task Divisions</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage the task divisions available across the application.</p>
                                <div className="space-y-2 max-w-md">
                                    {localSettings.divisions.map((division, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">
                                            <span className="text-gray-800 dark:text-gray-200">{division}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleDeleteDivision(division)} 
                                                className="text-red-500 hover:text-red-400"
                                                title={`Delete ${division}`}
                                            >
                                                {ICONS.trash}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex space-x-2 max-w-md">
                                    <input
                                        type="text"
                                        value={newDivision}
                                        onChange={(e) => setNewDivision(e.target.value)}
                                        placeholder="Add new division"
                                        className="flex-grow p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddDivision}
                                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Teammate Roles</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage the teammate roles available for assignment.</p>
                                <div className="space-y-2 max-w-md">
                                    {localSettings.roles.map((role, index) => (
                                        <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md">
                                            <span className="text-gray-800 dark:text-gray-200">{role}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => handleDeleteRole(role)} 
                                                className="text-red-500 hover:text-red-400"
                                                title={`Delete ${role}`}
                                                disabled={role === 'CEO'}
                                            >
                                                {ICONS.trash}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex space-x-2 max-w-md">
                                    <input
                                        type="text"
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        placeholder="Add new role"
                                        className="flex-grow p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddRole}
                                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700 mt-6 space-x-4">
                        {successMessage && <p className="text-green-500 dark:text-green-400 text-sm">{successMessage}</p>}
                        <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-lg">
                            Save Settings
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
