import React, { useState, useRef, useEffect } from 'react';
import { COUNCIL_MEMBERS, INITIAL_GREETING } from './constants';
import { Message, Attachment } from './types';
import { CouncilMemberCard } from './components/CouncilMemberCard';
import { ChatMessage } from './components/ChatMessage';
import { getMemberResponse, getChairmanSynthesis, getPeerCritique } from './services/geminiService';
import { Icon } from './components/Icon';

const App: React.FC = () => {
  // State
  const [activeMemberIds, setActiveMemberIds] = useState<string[]>(['forensic', 'ux-director', 'consumer', 'chairman']); 
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImages, setSelectedImages] = useState<Attachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggleMember = (id: string) => {
    setActiveMemberIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedImages.length < 2) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        setSelectedImages(prev => [...prev, {
          base64: base64Data,
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    }
    // Reset value to allow selecting the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && selectedImages.length === 0) || isProcessing) return;
    
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      attachments: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSelectedImages([]);
    setIsProcessing(true);
    setProcessingStatus('INITIALIZING COUNCIL...');
    
    // 2. Identify active council members (excluding Chairman for the first pass)
    const activeMembers = COUNCIL_MEMBERS.filter(m => activeMemberIds.includes(m.id) && m.id !== 'chairman');
    const isChairmanActive = activeMemberIds.includes('chairman');

    // 3. Create placeholders
    const placeholders: Message[] = activeMembers.map(m => ({
      id: `thinking-${m.id}-${Date.now()}`,
      role: 'assistant',
      memberId: m.id,
      content: '',
      timestamp: Date.now(),
      isThinking: true
    }));
    
    setMessages(prev => [...prev, ...placeholders]);

    // --- STAGE 1: INDIVIDUAL ANALYSIS ---
    setProcessingStatus('PHASE 1/3: INDIVIDUAL ANALYSIS...');
    
    const analysisPromises = activeMembers.map(async (member) => {
      const responseText = await getMemberResponse(member, userMsg.content, userMsg.attachments, []);
      
      setMessages(prev => prev.map(msg => {
        if (msg.memberId === member.id && msg.isThinking) {
          return { ...msg, content: responseText, isThinking: false, id: `msg-${member.id}-${Date.now()}` };
        }
        return msg;
      }));
      
      return { memberName: member.name, response: responseText };
    });

    const analysisResults = await Promise.all(analysisPromises);

    // --- STAGE 2: PEER VERIFICATION (Cross-Critique) ---
    // Only verify if we have multiple active members
    let peerCritiques: { reviewer: string; critique: string }[] = [];
    if (analysisResults.length > 1) {
      setProcessingStatus('PHASE 2/3: PEER VERIFICATION...');
      
      const critiquePromises = activeMembers.map(async (member) => {
        // Each member critiques the others
        const others = analysisResults.filter(r => r.memberName !== member.name);
        return getPeerCritique(member, others);
      });
      
      peerCritiques = await Promise.all(critiquePromises);
    }

    // --- STAGE 3: CHAIRMAN SYNTHESIS ---
    if (isChairmanActive) {
      setProcessingStatus('PHASE 3/3: FINAL VERDICT...');
      
      const chairmanPlaceholder: Message = {
        id: `thinking-chairman-${Date.now()}`,
        role: 'assistant',
        memberId: 'chairman',
        content: '',
        timestamp: Date.now(),
        isThinking: true
      };
      setMessages(prev => [...prev, chairmanPlaceholder]);

      const synthesis = await getChairmanSynthesis(userMsg.content, userMsg.attachments, analysisResults, peerCritiques);
      
      setMessages(prev => prev.map(msg => {
        if (msg.memberId === 'chairman' && msg.isThinking) {
          return { ...msg, content: synthesis, isThinking: false, id: `msg-chairman-${Date.now()}` };
        }
        return msg;
      }));
    }

    setIsProcessing(false);
    setProcessingStatus('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar - Technical Modules */}
      <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col hidden md:flex z-10 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <Icon name="Scale" size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">COMPARISON<span className="text-slate-500">ENGINE</span></h1>
          </div>
          <p className="text-xs text-slate-500 font-mono">v3.1.0 // CROSS-VERIFIED</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analysis Team</h2>
            <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded border border-slate-800 font-mono">
              {activeMemberIds.length}/{COUNCIL_MEMBERS.length}
            </span>
          </div>
          {COUNCIL_MEMBERS.map(member => (
            <CouncilMemberCard 
              key={member.id}
              member={member}
              isActive={activeMemberIds.includes(member.id)}
              onToggle={handleToggleMember}
            />
          ))}
        </div>

        <div className="p-4 border-t border-slate-900 bg-slate-950">
            <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono">
              <span>LATENCY: 45ms</span>
              <span className="text-green-500">● ONLINE</span>
            </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-slate-950">
        {/* CSS Grid Pattern Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80 pointer-events-none"></div>

        {/* Mobile Header */}
        <div className="md:hidden h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-950 z-20">
           <span className="font-bold text-sm">COMPARISON ENGINE</span>
           <span className="text-xs text-indigo-400 font-mono">{activeMemberIds.length} AGENTS</span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-36 pt-6 scroll-smooth" ref={scrollRef}>
          <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end space-y-6">
             {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center flex-col opacity-30 select-none">
                    <div className="flex -space-x-4 mb-6">
                      <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center transform -rotate-6">
                         <span className="text-2xl font-bold text-slate-500">A</span>
                      </div>
                      <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center transform rotate-6 z-10">
                         <span className="text-2xl font-bold text-slate-500">B</span>
                      </div>
                    </div>
                    <p className="font-medium text-slate-400">A/B Image Comparison</p>
                    <p className="text-sm text-slate-600 mt-2 font-mono">Upload 2 images to compare</p>
                </div>
             )}
             {messages.map(msg => (
               <ChatMessage key={msg.id} message={msg} members={COUNCIL_MEMBERS} />
             ))}
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-6 left-0 right-0 px-4 z-30">
          <div className="max-w-3xl mx-auto">
            {/* Image Preview */}
            {selectedImages.length > 0 && (
              <div className="mb-2 ml-2 flex space-x-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative inline-block group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition"></div>
                    <img 
                      src={`data:${img.mimeType};base64,${img.base64}`} 
                      className="relative h-20 w-auto rounded-lg border border-slate-700 shadow-2xl bg-slate-900" 
                      alt="Preview"
                    />
                    <div className="absolute top-0 left-0 bg-black/60 text-white text-[9px] px-1.5 rounded-br-lg backdrop-blur-sm">
                      {idx === 0 ? 'IMG A' : 'IMG B'}
                    </div>
                    <button 
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 rounded-full p-1 border border-slate-700 transition-all"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Capsule */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
              <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl flex items-center p-2 shadow-2xl">
                 <button 
                   onClick={() => selectedImages.length < 2 && fileInputRef.current?.click()}
                   disabled={selectedImages.length >= 2}
                   className={`p-3 rounded-xl transition-all duration-200 ${selectedImages.length > 0 ? 'text-indigo-400 bg-indigo-400/10' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'} ${selectedImages.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                   title="Add visual context (Max 2)"
                 >
                   <Icon name="Paperclip" size={20} />
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   onChange={handleFileSelect}
                   accept="image/*"
                   className="hidden"
                 />
                 
                 <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedImages.length === 2 ? "Ask for comparison..." : "Upload images to compare..."}
                    disabled={isProcessing}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 px-4 py-2 font-medium"
                 />
                 
                 <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && selectedImages.length === 0) || isProcessing}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                 >
                    {isProcessing ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                       <Icon name="ArrowUp" size={20} />
                    )}
                 </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-3 opacity-40 hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-mono text-slate-500">POWERED BY GEMINI 2.5 FLASH & 3.0 PRO</span>
               {isProcessing && (
                 <span className="text-[10px] font-mono text-indigo-400 animate-pulse">{processingStatus}</span>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;