import React, { useState } from 'react';
import { Candidate } from '../../types';
import ImportModal from './ImportModal';

interface CandidatesViewProps {
    onAddCandidates: (candidates: Candidate[]) => void;
}

const CandidatesView: React.FC<CandidatesViewProps> = ({ onAddCandidates }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">Gestão de Candidatos</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-4 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Importar Candidatos do Google Forms
                </button>
            </div>

            <div className="bg-light-surface dark:bg-surface p-8 rounded-xl border border-light-border dark:border-border text-center">
                <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Importe Candidatos Facilmente</h2>
                <p className="mt-2 text-light-text-secondary dark:text-text-secondary max-w-2xl mx-auto">
                    Use a funcionalidade de importação para trazer candidatos de um Google Form diretamente para a plataforma. Clique no botão acima para começar.
                </p>
            </div>

            <ImportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddCandidates={onAddCandidates}
            />
        </div>
    );
};

export default CandidatesView;