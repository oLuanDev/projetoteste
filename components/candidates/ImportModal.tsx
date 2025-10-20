import React, { useState } from 'react';
// FIX: Import CandidateStatus to be used for type casting to resolve the type error.
import { Candidate, CandidateStatus } from '../../types';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCandidates: (candidates: Candidate[]) => void;
}

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
);

// Helper function to robustly parse Google Forms timestamp (e.g., "25/07/2024 14:30:00")
const parseGoogleFormsTimestamp = (timestamp: string): Date | null => {
    // Match "DD/MM/YYYY HH:mm:ss" format
    const match = timestamp.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s(\d{1,2}):(\d{1,2}):(\d{1,2})/);
    if (!match) {
        // If format doesn't match, try parsing directly (fallback for other formats)
        const d = new Date(timestamp);
        return isNaN(d.getTime()) ? null : d;
    };

    const [, day, month, year, hours, minutes, seconds] = match.map(Number);
    
    // JavaScript's Date constructor uses a 0-indexed month
    const parsedDate = new Date(year, month - 1, day, hours, minutes, seconds);

    // Check if the created date is valid
    if (isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};


const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onAddCandidates }) => {
    const [csvUrl, setCsvUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    let candidateIdCounter = Date.now();

    if (!isOpen) return null;
    
    // Robust CSV parser that handles quoted fields with commas
    const parseCSV = (text: string): string[][] => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const result: string[][] = [];

        for (const line of lines) {
            const row: string[] = [];
            let field = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') { // Escaped quote
                        field += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(field.trim());
                    field = '';
                } else {
                    field += char;
                }
            }
            row.push(field.trim());
            result.push(row);
        }
        return result;
    };

    const handleImport = async () => {
        if (!csvUrl) {
            setError('Por favor, insira a URL do CSV.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error('Falha ao buscar os dados. Verifique a URL e as permissões de compartilhamento.');
            }
            const csvText = await response.text();
            const rows = parseCSV(csvText);
            
            if (rows.length < 2) {
                throw new Error("Nenhum dado de candidato encontrado no arquivo. Verifique se há um cabeçalho e pelo menos uma linha de dados.");
            }
            
            const header = rows[0].map(h => h.toLowerCase().trim().replace(/"/g, ''));
            const candidatesData = rows.slice(1);

            const findIndex = (possibleNames: string[]) => {
                for (const name of possibleNames) {
                    const lowerName = name.toLowerCase();
                    const index = header.indexOf(lowerName);
                    if (index !== -1) return index;
                }
                // Fallback for partial match
                for (const name of possibleNames) {
                    const lowerName = name.toLowerCase();
                    const index = header.findIndex(h => h.includes(lowerName));
                    if (index !== -1) return index;
                }
                return -1;
            };

            const colMap = {
                timestamp: findIndex(["timestamp", "carimbo de data/hora"]),
                email: findIndex(["email", "endereço de e-mail"]),
                name: findIndex(["nome completo", "nome"]),
                phone: findIndex(["telefone", "celular", "phone"]),
                age: findIndex(["idade", "age"]),
                maritalStatus: findIndex(["estado civil"]),
                location: findIndex(["localização", "endereço", "cidade", "bairro"]),
                education: findIndex(["educação", "escolaridade", "grau de instrução"]),
                experience: findIndex(["experiência profissional", "experiência"]),
                skills: findIndex(["habilidades", "skills", "competências"]),
                summary: findIndex(["resumo pessoal", "resumo", "summary", "sobre você"]),
            };

            if (colMap.name === -1) {
                throw new Error(`Não foi possível encontrar a coluna "Nome completo" no arquivo CSV. Verifique o cabeçalho. Cabeçalhos encontrados: ${header.join(', ')}`);
            }
            
            const newCandidates: Candidate[] = candidatesData.map((row, index) => {
                const getValue = (key: keyof typeof colMap) => {
                    const idx = colMap[key];
                    return idx !== -1 ? (row[idx] || '').trim() : '';
                };

                const name = getValue('name');
                if (!name) return null; // Skip rows without a name

                const applicationTimestamp = getValue('timestamp');
                let applicationDateISO = new Date().toISOString();
                if (applicationTimestamp) {
                    const parsedDate = parseGoogleFormsTimestamp(applicationTimestamp);
                    if (parsedDate) {
                        applicationDateISO = parsedDate.toISOString();
                    } else {
                        console.warn(`Could not parse date "${applicationTimestamp}". Using current date as fallback.`);
                    }
                }

                return {
                    id: candidateIdCounter + index,
                    name: name,
                    age: parseInt(getValue('age')) || 0,
                    maritalStatus: getValue('maritalStatus') || 'Não informado',
                    location: getValue('location') || 'Não informado',
                    experience: getValue('experience') || 'Não informado',
                    education: getValue('education') || 'Não informado',
                    skills: getValue('skills') ? getValue('skills').split(/[,;]/).map(s => s.trim()).filter(Boolean) : [],
                    summary: getValue('summary') || `Candidato importado via Google Forms.`,
                    jobId: 'sg-01', // Hardcoded for "Auxiliar de Serviços Gerais"
                    fitScore: 8.0 + Math.random(), // Assign a default high score
                    status: 'screening' as CandidateStatus,
                    applicationDate: applicationDateISO,
                    source: 'Google Forms Import',
                    isArchived: false,
                    resume: {
                        professionalExperience: [{ company: 'N/A', role: 'N/A', duration: getValue('experience'), description: getValue('experience') }],
                        courses: [],
                        availability: 'A confirmar',
                        contact: {
                            phone: getValue('phone') || 'Não informado',
                            email: getValue('email') || 'Não informado',
                        },
                        personalSummary: getValue('summary') || '',
                    }
                };
            }).filter((c): c is Exclude<typeof c, null> => c !== null); // Type guard to filter out nulls

            if (newCandidates.length > 0) {
                onAddCandidates(newCandidates);
                setSuccessMessage(`${newCandidates.length} candidato(s) importado(s) com sucesso! Eles foram adicionados à vaga "Auxiliar de Serviços Gerais".`);
            } else {
                 setError("Nenhum candidato válido pôde ser importado. Verifique se a coluna 'Nome completo' está presente e se há dados nos candidatos.");
            }

            setCsvUrl('');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">Importar Candidatos do Google Forms</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-3xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="font-semibold text-light-text-primary dark:text-text-primary">Como obter o link de importação:</h3>
                        <ol className="list-decimal list-inside text-sm text-light-text-secondary dark:text-text-secondary mt-2 space-y-1">
                            <li>Abra a planilha do Google Sheets com as respostas do seu formulário.</li>
                            <li>Vá em <span className="font-semibold">Arquivo &gt; Compartilhar &gt; Publicar na web</span>.</li>
                            <li>Na nova janela, selecione a página correta, escolha o formato <span className="font-semibold">"Valores separados por vírgula (.csv)"</span>.</li>
                            <li>Clique em <span className="font-semibold">"Publicar"</span> e copie o link gerado.</li>
                        </ol>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="csv-url" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary">URL pública do arquivo CSV</label>
                        <input
                            id="csv-url"
                            type="url"
                            value={csvUrl}
                            onChange={(e) => setCsvUrl(e.target.value)}
                            placeholder="Cole o link da planilha publicada aqui..."
                            className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary"
                        />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                    {successMessage && <p className="text-green-600 dark:text-green-400 text-sm bg-green-500/10 p-3 rounded-md">{successMessage}</p>}
                </div>
                <div className="p-5 border-t border-light-border dark:border-border flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-light-border dark:bg-border text-light-text-primary dark:text-text-primary font-bold px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-border/70 transition-colors">
                        Fechar
                    </button>
                    <button
                        type="button"
                        onClick={handleImport}
                        disabled={isLoading}
                        className="bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-5 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Spinner /> : null}
                        {isLoading ? 'Importando...' : 'Importar Dados'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;