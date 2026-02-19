import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane, FaUserMd, FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';

const Chatbot = ({ initialOpen = false, analysisData = {}, currentStep = 1 }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hello! I am your AI Clinical Assistant. I'm monitoring the diagnostic chain and ready to provide real-time insights. How can I assist you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (initialOpen) setIsOpen(true);
    }, [initialOpen]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const getStatusResponse = () => {
        const { classification, diagnosis } = analysisData;

        if (currentStep === 1) return "We are currently in the **Specimen Upload** phase. Please upload a high-quality fundus image to begin the analysis.";
        if (currentStep === 2) return "The **Optimal ACE Filter** is active. This process enhances vascular contrast to make early diagnostic signals more visible.";
        if (currentStep === 3) return "The **U-Net AI** is currently isolating the retinal vascular tree. This segmentation logic creates the foundation for identifying lesions.";
        if (currentStep === 4) return "We are in the **Pathology Detection** phase. The AI is scanning the isolated vessels for microaneurysms and hemorrhages.";

        if (!classification) return "The analysis is processing. Please continue through the steps to see the final clinical grading.";

        const severity = classification.label.replace('_', ' ');
        const confidence = Math.round(classification.confidence * 100);

        return `Analysis complete. Result: **${severity}** (${confidence}% confidence). The diagnostic engine ${diagnosis?.label !== 'No_DR' ? 'identified' : 'did not find'} retinopathy-specific biomarkers.`;
    };

    const responses = {
        "status": getStatusResponse(),
        "my diagnosis": getStatusResponse(),
        "result": getStatusResponse(),
        "exudates": "Exudates are fluid leakages from damaged retinal blood vessels. They appear as yellowish spots and indicate active disease progression in the retina.",
        "dr": "Diabetic Retinopathy (DR) is a complication of diabetes that affects the eyes. It's caused by damage to the blood vessels of the light-sensitive tissue at the back of the eye (retina).",
        "npdr": "Non-Proliferative Diabetic Retinopathy (NPDR) is the early stage of eye disease where blood vessels in the retina leak fluid into the eye.",
        "treatment": "Treatment depends on the severity. Options include laser therapy (PRP), Anti-VEGF injections, and most importantly, strict management of blood sugar and pressure.",
        "drive": "Driving capability depends on your current visual acuity and the presence of macular edema. Please consult your ophthalmologist for a functional vision test.",
        "final": "This is an AI-assisted diagnostic output. While highly accurate, it should always be cross-verified by a licensed clinical specialist.",
        "help": "I can explain medical terms, explain what's happening at this 'step', or provide your current 'status'. Just ask!"
    };

    const handleSend = (text = input) => {
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        setTimeout(() => {
            let aiResponse = "I'm monitoring the diagnostic chain. You can ask about the 'current step', my 'status', or terms like 'exudates' and 'NPDR'.";

            const lowerText = text.toLowerCase();
            for (const key in responses) {
                if (lowerText.includes(key)) {
                    aiResponse = responses[key];
                    break;
                }
            }

            if (lowerText.includes("step") || lowerText.includes("current")) {
                aiResponse = getStatusResponse();
            }

            setMessages([...newMessages, { role: 'assistant', text: aiResponse }]);
            setIsTyping(false);
        }, 800);
    };

    const quickPrompts = [
        "What is NPDR?",
        "Tell me my status",
        "How is DR treated?",
        "Is this final?",
        "Can I drive?"
    ];

    return (
        <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1050 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="medical-card p-0 shadow-premium overflow-hidden border-0 mb-3"
                        style={{ width: '380px', height: '580px', display: 'flex', flexDirection: 'column', background: 'white' }}
                    >
                        {/* Header */}
                        <div className="p-3 bg-medical text-white d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                                <div className="bg-white rounded-circle p-1 overflow-hidden d-flex align-items-center justify-content-center shadow-sm" style={{ width: '44px', height: '44px' }}>
                                    <img src="/clinical_bot_final.png" alt="Bot" className="img-fluid" />
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">RetinaLens AI Assistant</h6>
                                    <span className="x-small opacity-75 fw-bold tracking-widest text-uppercase">Precision-V2 Active</span>
                                </div>
                            </div>
                            <button className="btn btn-link text-white p-0 opacity-75 hover-opacity-100" onClick={() => setIsOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div
                            ref={scrollRef}
                            className="flex-grow-1 p-3 overflow-auto bg-light bg-opacity-30"
                            style={{ scrollBehavior: 'smooth' }}
                        >
                            <div className="p-3 rounded-4 bg-white border-0 shadow-sm x-small border-start border-medical border-4 d-flex gap-3 mb-4">
                                <FaExclamationTriangle className="text-warning mt-1" />
                                <span className="text-secondary fw-medium">Educational support only. Findings must be validated by a clinical specialist.</span>
                            </div>

                            {messages.map((m, i) => (
                                <div key={i} className={`d-flex mb-4 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                    <div
                                        className={`p-3 rounded-4 shadow-sm small ${m.role === 'user'
                                            ? 'bg-dark-medical text-white fw-bold'
                                            : 'bg-white text-dark border-0 shadow-sm'
                                            }`}
                                        style={{
                                            maxWidth: '85%',
                                            lineHeight: '1.6',
                                            backgroundColor: m.role === 'user' ? '#1d4ed8' : '#ffffff'
                                        }}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="d-flex justify-content-start mb-3">
                                    <div className="bg-white p-3 rounded-4 shadow-sm border-0">
                                        <div className="medical-loader-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Prompts */}
                        <div className="px-3 py-2 bg-white border-top">
                            <div className="d-flex gap-2 overflow-auto py-2 no-scrollbar" style={{ whiteSpace: 'nowrap' }}>
                                {quickPrompts.map((p, i) => (
                                    <button
                                        key={i}
                                        className="btn btn-outline-medical rounded-pill small px-3 py-1 fw-bold"
                                        style={{ fontSize: '0.65rem' }}
                                        onClick={() => handleSend(p)}
                                    >
                                        <FaLightbulb className="me-1" /> {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-top shadow-lg">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control border-0 bg-light rounded-start-pill ps-4 py-2"
                                    style={{ fontSize: '0.85rem' }}
                                    placeholder="Type your question..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <button
                                    className="btn btn-medical rounded-end-pill px-4"
                                    onClick={() => handleSend()}
                                >
                                    <FaPaperPlane size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn rounded-circle shadow-premium p-0 overflow-hidden d-flex align-items-center justify-content-center border-0 ${isOpen ? 'bg-white text-medical' : 'bg-medical'}`}
                style={{ width: '72px', height: '72px' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FaTimes size={28} /> : <img src="/clinical_bot_final.png" alt="Bot" className="img-fluid p-2" />}
            </motion.button>

            <style>{`
        .x-small { font-size: 0.75rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .medical-loader-dots span {
          width: 6px;
          height: 6px;
          background: var(--medical-primary);
          border-radius: 50%;
          display: inline-block;
          margin: 0 2px;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .medical-loader-dots span:nth-child(1) { animation-delay: -0.32s; }
        .medical-loader-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1.0); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default Chatbot;
