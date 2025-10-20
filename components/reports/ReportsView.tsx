import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Job, Candidate, Talent } from '../../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const title = label || payload[0].name;
    return (
      <div className="bg-light-surface dark:bg-surface p-3 border border-light-border dark:border-border rounded-lg shadow-lg">
        <p className="label text-light-text-primary dark:text-text-primary font-bold">{title}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color || pld.fill }} className="text-sm">{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const ReportsView: React.FC<{ jobs: Job[]; candidates: Candidate[], talentPool: Talent[] }> = ({ jobs, candidates, talentPool }) => {

    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const hiringFunnelData = useMemo(() => {
        const data: { [key: string]: { month: string, Contratados: number, Rejeitados: number } } = {};
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        for (let i = 0; i < 6; i++) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(sixMonthsAgo.getMonth() + i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            data[monthKey] = { month: months[date.getMonth()], Contratados: 0, Rejeitados: 0 };
        }
        
        candidates.forEach(c => {
            const appDate = new Date(c.applicationDate);
            if (appDate >= sixMonthsAgo) {
                 const monthKey = `${appDate.getFullYear()}-${appDate.getMonth()}`;
                 if(data[monthKey]) {
                     if (c.status === 'hired') data[monthKey].Contratados++;
                     if (c.status === 'rejected') data[monthKey].Rejeitados++;
                 }
            }
        });
        
        return Object.values(data);
    }, [candidates, months]);

    const departmentComparisonData = useMemo(() => {
        const jobDeptMap = new Map(jobs.map(j => [j.id, j.department]));
        const data: { [key: string]: { name: string, Inscritos: number, Contratados: number, Rejeitados: number } } = {};

        jobs.forEach(j => {
             data[j.department] = { name: j.department, Inscritos: 0, Contratados: 0, Rejeitados: 0 };
        });

        candidates.forEach(c => {
            // FIX: The type of `dept` was being inferred incorrectly as 'unknown' in this context.
            // Explicitly casting the result of `jobDeptMap.get` to `string | undefined` ensures
            // that `dept` is treated as a valid string index within the `if` block.
            const dept = jobDeptMap.get(c.jobId) as (string | undefined);
            if(dept && data[dept]) {
                data[dept].Inscritos++;
                if (c.status === 'hired') data[dept].Contratados++;
                if (c.status === 'rejected') data[dept].Rejeitados++;
            }
        });

        return Object.values(data).filter(d => d.Inscritos > 0);
    }, [candidates, jobs]);

    const locationComparisonData = useMemo(() => {
        const locationCounts: { [key: string]: number } = {};
        candidates.forEach(c => {
            let city = 'Outros';
            if (c.location.includes('Campinas')) city = 'Campinas';
            else if (c.location.includes('Valinhos')) city = 'Valinhos';
            else if (c.location.includes('Hortolândia')) city = 'Hortolândia';
            else if (c.location.includes('Sumaré')) city = 'Sumaré';
            locationCounts[city] = (locationCounts[city] || 0) + 1;
        });
        return Object.entries(locationCounts).map(([name, value]) => ({ name, value }));
    }, [candidates]);
    
    const COLORS = ['#2DD4BF', '#4F46E5', '#FBBF24', '#F87171', '#A78BFA', '#EC4899'];

    const turnoverData = useMemo(() => [
        { month: 'Jan', 'Taxa de Turnover (%)': 4.5 },
        { month: 'Fev', 'Taxa de Turnover (%)': 3.8 },
        { month: 'Mar', 'Taxa de Turnover (%)': 5.1 },
        { month: 'Abr', 'Taxa de Turnover (%)': 4.2 },
        { month: 'Mai', 'Taxa de Turnover (%)': 3.9 },
        { month: 'Jun', 'Taxa de Turnover (%)': 4.0 },
    ], []);

    const absenteeismData = useMemo(() => {
        const data: { [key: string]: { month: string, 'Faltas em Entrevistas': number } } = {};
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

         for (let i = 0; i < 6; i++) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(sixMonthsAgo.getMonth() + i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            data[monthKey] = { month: months[date.getMonth()], 'Faltas em Entrevistas': 0 };
        }
        
        candidates.forEach(c => {
            if (c.interview?.noShow) {
                const interviewDate = new Date(c.interview.date);
                 if (interviewDate >= sixMonthsAgo) {
                    const monthKey = `${interviewDate.getFullYear()}-${interviewDate.getMonth()}`;
                    if(data[monthKey]) {
                        data[monthKey]['Faltas em Entrevistas']++;
                    }
                }
            }
        });
        
        return Object.values(data);
    }, [candidates, months]);

    const talentOriginData = useMemo(() => {
        const originCounts: { [key: string]: number } = {};
        talentPool.forEach(t => {
            let city = 'Outros';
            if (t.city.includes('Campinas')) city = 'Campinas';
            originCounts[city] = (originCounts[city] || 0) + 1;
        });
        return Object.entries(originCounts).map(([name, value]) => ({ name, value }));
    }, [talentPool]);

    const talentGenderData = useMemo(() => {
        const genderCounts = { 'Masculino': 0, 'Feminino': 0, 'Não informado': 0 };
        talentPool.forEach(t => {
            if (t.gender === 'male') genderCounts['Masculino']++;
            else if (t.gender === 'female') genderCounts['Feminino']++;
            else genderCounts['Não informado']++;
        });
        return Object.entries(genderCounts)
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0);
    }, [talentPool]);

    const TALENT_COLORS = ['#4F46E5', '#EC4899', '#9CA3AF']; // Indigo, Pink, Gray

    const ChartWrapper: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border">
            <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">{title}</h2>
            <ResponsiveContainer width="100%" height={300}>
                {children}
            </ResponsiveContainer>
        </div>
    )

    return (
        <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary mb-8">Relatórios Gerenciais</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartWrapper title="Funil de Contratações (Últimos 6 Meses)">
                    <BarChart data={hiringFunnelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Contratados" fill="#2DD4BF" />
                        <Bar dataKey="Rejeitados" fill="#F87171" />
                    </BarChart>
                </ChartWrapper>
                
                <ChartWrapper title="Comparativo por Setor">
                    <BarChart data={departmentComparisonData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis type="number" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
                        <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" width={80} tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}/>
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Inscritos" fill="#4F46E5" />
                        <Bar dataKey="Contratados" fill="#2DD4BF" />
                        <Bar dataKey="Rejeitados" fill="#F87171" />
                    </BarChart>
                </ChartWrapper>

                <ChartWrapper title="Origem dos Candidatos por Cidade">
                     <PieChart>
                        <Pie data={locationComparisonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {locationComparisonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>
                
                <ChartWrapper title="Evolução do Turnover">
                    <LineChart data={turnoverData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }} unit="%"/>
                        <Tooltip content={<CustomTooltip />} cursor={{stroke: 'var(--color-primary)', strokeWidth: 1}}/>
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Line type="monotone" dataKey="Taxa de Turnover (%)" stroke="#EC4899" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}}/>
                    </LineChart>
                </ChartWrapper>

                <ChartWrapper title="Monitoramento de Absenteísmo em Entrevistas">
                    <BarChart data={absenteeismData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }} allowDecimals={false}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}/>
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Faltas em Entrevistas" fill="#FBBF24" />
                    </BarChart>
                </ChartWrapper>

                <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border flex flex-col justify-center items-center text-center">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-2">Total de Talentos</h3>
                    <p className="text-6xl font-extrabold text-light-primary dark:text-primary">{talentPool.length}</p>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1">profissionais em seu banco.</p>
                </div>

                <ChartWrapper title="Origem dos Talentos">
                    <PieChart>
                        <Pie data={talentOriginData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {talentOriginData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>

                <ChartWrapper title="Gênero dos Talentos">
                    <PieChart>
                        <Pie data={talentGenderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {talentGenderData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={TALENT_COLORS[index % TALENT_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>
            </div>
        </div>
    );
};

export default ReportsView;