import React from 'react';
import { Card } from '@/components/ui/Card';

// Group color palette for visual distinction
const GROUP_COLORS = [
    { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
    { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
    { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
    { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
    { bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
    { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-indigo-300 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
    { bg: 'bg-teal-100 dark:bg-teal-900/30', border: 'border-teal-300 dark:border-teal-700', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
];

export default function GridPreview({ data }) {
    if (!data || !data.groups) return null;

    const groupNames = Object.keys(data.groups);
    const colorMap = {};
    groupNames.forEach((name, i) => {
        colorMap[name] = GROUP_COLORS[i % GROUP_COLORS.length];
    });

    // If we have grid data, render a seat grid
    const hasGrid = data.grid && data.grid.rows && data.grid.cols;

    // Build seat lookup
    const seatLookup = {};
    for (const [groupName, members] of Object.entries(data.groups)) {
        for (const member of members) {
            if (member.seat_row && member.seat_col) {
                seatLookup[`${member.seat_row}-${member.seat_col}`] = {
                    ...member,
                    group_name: groupName,
                };
            }
        }
    }

    const blockedSet = new Set(
        (data.grid?.blocked_cells || []).map(c => `${c.row}-${c.col}`)
    );

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-none">
                    <div className="text-3xl font-black text-blue-600">{data.totalAssignments}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Assigned</div>
                </Card>
                <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-none">
                    <div className="text-3xl font-black text-purple-600">{groupNames.length}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Groups</div>
                </Card>
                {hasGrid && (
                    <>
                        <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/10 dark:to-teal-900/10 border-none">
                            <div className="text-3xl font-black text-green-600">{data.grid.rows}×{data.grid.cols}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Grid Size</div>
                        </Card>
                        <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 border-none">
                            <div className="text-3xl font-black text-orange-600">{data.grid.blocked_cells?.length || 0}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Blocked Cells</div>
                        </Card>
                    </>
                )}
            </div>

            {/* Seat Grid Visualization */}
            {hasGrid && (
                <Card className="p-6 overflow-x-auto">
                    <h3 className="font-bold mb-4 text-slate-800 dark:text-white">Seating Grid</h3>
                    <div
                        className="inline-grid gap-1.5"
                        style={{
                            gridTemplateColumns: `repeat(${data.grid.cols}, minmax(60px, 1fr))`,
                        }}
                    >
                        {Array.from({ length: data.grid.rows }).map((_, r) =>
                            Array.from({ length: data.grid.cols }).map((_, c) => {
                                const row = r + 1;
                                const col = c + 1;
                                const key = `${row}-${col}`;
                                const isBlocked = blockedSet.has(key);
                                const occupant = seatLookup[key];
                                const color = occupant ? colorMap[occupant.group_name] : null;

                                return (
                                    <div
                                        key={key}
                                        className={`relative w-full min-h-[50px] rounded-lg border-2 flex flex-col items-center justify-center text-center p-1 transition-all ${
                                            isBlocked
                                                ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-600 opacity-40'
                                                : occupant
                                                    ? `${color.bg} ${color.border}`
                                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border-dashed'
                                        }`}
                                        title={
                                            isBlocked ? 'Blocked' :
                                            occupant ? `${occupant.name} — ${occupant.group_name} (${occupant.role})` :
                                            `R${row} C${col} — Empty`
                                        }
                                    >
                                        {isBlocked ? (
                                            <span className="text-slate-400 text-[10px]">✕</span>
                                        ) : occupant ? (
                                            <>
                                                <span className={`text-[9px] font-bold truncate w-full ${color.text}`}>
                                                    {occupant.name?.split(' ')[0]}
                                                </span>
                                                <span className="text-[8px] text-slate-400">{occupant.role}</span>
                                            </>
                                        ) : (
                                            <span className="text-[9px] text-slate-300">{row}.{col}</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>
            )}

            {/* Group Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupNames.map(groupName => {
                    const members = data.groups[groupName];
                    const color = colorMap[groupName];
                    return (
                        <Card key={groupName} className={`overflow-hidden border-2 ${color.border}`}>
                            <div className={`${color.bg} px-4 py-3 flex items-center gap-2`}>
                                <div className={`w-3 h-3 rounded-full ${color.dot}`} />
                                <h4 className={`font-bold text-sm ${color.text}`}>{groupName}</h4>
                                <span className="ml-auto text-[10px] font-bold text-slate-400">{members.length} members</span>
                            </div>
                            <div className="p-3 space-y-1">
                                {members.map(m => (
                                    <div key={m.user_id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                        <div>
                                            <span className="text-sm font-medium text-slate-800 dark:text-white">{m.name}</span>
                                            <span className="text-[10px] text-slate-400 ml-2">{m.branch}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {m.seat_row && (
                                                <span className="text-[10px] font-mono text-slate-400">R{m.seat_row}·C{m.seat_col}</span>
                                            )}
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${color.bg} ${color.text}`}>
                                                {m.role}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
