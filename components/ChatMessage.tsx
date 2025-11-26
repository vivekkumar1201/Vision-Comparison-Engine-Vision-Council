import React from 'react';
import { Message, CouncilMember } from '../types';
import { Icon } from './Icon';

interface Props {
  message: Message;
  members: CouncilMember[];
}

export const ChatMessage: React.FC<Props> = ({ message, members }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-8 opacity-50">
        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded full uppercase tracking-widest">
          {message.content}
        </span>
      </div>
    );
  }

  // Find the member if it's an assistant message
  const member = members.find(m => m.id === message.memberId);
  
  if (isUser) {
    return (
      <div className="flex justify-end mb-8 pl-12">
        <div className="flex flex-col items-end space-y-2 max-w-[80%]">
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex gap-2 mb-2">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="relative group">
                  <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                    <img 
                      src={`data:${att.mimeType};base64,${att.base64}`} 
                      alt={`Upload ${idx + 1}`} 
                      className="max-h-48 w-auto object-cover bg-slate-900"
                    />
                  </div>
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 rounded backdrop-blur-sm border border-white/10">
                    {idx === 0 ? 'IMG A' : 'IMG B'}
                  </div>
                </div>
              ))}
            </div>
          )}
          {message.content && (
            <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-lg shadow-indigo-900/20">
               <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant / Council Member Design
  const borderColorMap: Record<string, string> = {
    emerald: 'border-l-emerald-500/50',
    rose: 'border-l-rose-500/50',
    violet: 'border-l-violet-500/50',
    amber: 'border-l-amber-500/50',
    sky: 'border-l-sky-500/50',
  };

  const textColorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    sky: 'text-sky-400',
  };

  const borderClass = member ? borderColorMap[member.color] || 'border-l-slate-500' : 'border-l-slate-500';
  const textClass = member ? textColorMap[member.color] || 'text-slate-400' : 'text-slate-400';

  // --- Custom Markdown Table & Content Renderer ---
  const renderContent = (text: string) => {
    const blocks = text.split('\n');
    const renderedBlocks: React.ReactNode[] = [];
    
    let tableBuffer: string[] = [];
    let isTable = false;
    let listBuffer: React.ReactNode[] = [];

    const flushList = () => {
      if (listBuffer.length > 0) {
        renderedBlocks.push(
          <ul key={`list-${renderedBlocks.length}`} className="list-disc ml-4 space-y-1 mb-4 text-slate-300">
            {[...listBuffer]}
          </ul>
        );
        listBuffer = [];
      }
    };

    const flushTable = () => {
        if (tableBuffer.length > 0) {
            // Remove divider row (digits, dashes, pipes)
            const cleanedRows = tableBuffer.filter(row => !row.match(/^\|?\s*[-:]+\s*\|/));
            
            if (cleanedRows.length < 2) return; // Not enough rows for a table

            const header = cleanedRows[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
            const body = cleanedRows.slice(1).map(row => row.split('|').filter(c => c.trim() !== '').map(c => c.trim()));

            renderedBlocks.push(
                <div key={`table-${renderedBlocks.length}`} className="overflow-x-auto my-4 rounded-lg border border-slate-800 shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
                            <tr>
                                {header.map((h, i) => (
                                    <th key={i} className="px-4 py-3 border-b border-slate-800 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 bg-slate-900/30">
                            {body.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="px-4 py-2.5 text-slate-300 font-mono">
                                          {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            tableBuffer = [];
        }
        isTable = false;
    };

    blocks.forEach((line, idx) => {
        const trimmed = line.trim();

        // Detect Table
        if (trimmed.startsWith('|')) {
            flushList();
            isTable = true;
            tableBuffer.push(trimmed);
            return;
        } else if (isTable) {
            flushTable();
        }

        // Detect Headers
        if (trimmed.startsWith('### ')) {
             flushList();
             renderedBlocks.push(<h3 key={idx} className={`text-sm font-bold mt-6 mb-2 uppercase tracking-wide ${textClass}`}>{trimmed.replace('### ', '')}</h3>);
             return;
        }
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
             flushList();
             renderedBlocks.push(<strong key={idx} className="block mt-4 mb-1 text-slate-200">{trimmed.replace(/\*\*/g, '')}</strong>);
             return;
        }

        // Detect Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            listBuffer.push(<li key={idx} className="pl-1"><span className="opacity-90">{trimmed.replace(/^[-*]\s/, '')}</span></li>);
            return;
        }

        // Standard Paragraph
        if (trimmed.length > 0) {
            flushList();
            renderedBlocks.push(<p key={idx} className="mb-2 leading-relaxed text-slate-300/90">{trimmed}</p>);
        }
    });

    flushList();
    flushTable();

    return renderedBlocks;
  };

  return (
    <div className={`flex flex-col mb-8 ${message.isThinking ? 'opacity-70' : 'opacity-100'} transition-opacity group`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
         <div className={`w-6 h-6 rounded flex items-center justify-center bg-slate-900 border border-slate-800 ${textClass}`}>
            <Icon name={member?.icon || 'Cpu'} size={14} />
         </div>
         <span className={`text-xs font-bold tracking-wide ${textClass}`}>
           {member?.name}
         </span>
         <span className="text-[10px] font-mono text-slate-600 uppercase border border-slate-800 px-1.5 rounded bg-slate-900">
           {member?.role}
         </span>
      </div>

      {/* Content Body */}
      <div className={`ml-3 pl-6 border-l-2 ${borderClass} py-1`}>
         {message.isThinking ? (
            <div className="flex items-center space-x-2 text-slate-500 my-4">
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
               <span className="text-xs font-mono ml-2 animate-pulse">GENERATING REPORT...</span>
            </div>
         ) : (
            <div className="text-sm">
               {renderContent(message.content)}
            </div>
         )}
      </div>
    </div>
  );
};