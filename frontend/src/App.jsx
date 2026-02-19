import React, { useState } from 'react';
import UploadStep from './components/UploadStep';
import FilterStep from './components/FilterStep';
import SegmentationStep from './components/SegmentationStep';
import DiagnosisStep from './components/DiagnosisStep';
import ClassificationStep from './components/ClassificationStep';
import Chatbot from './components/Chatbot';
import PrescriptionSection from './components/PrescriptionSection';
import AuthPage from './components/AuthPage';
import ReportStep from './components/ReportStep';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [step, setStep] = useState(1);
    const [imageId, setImageId] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [analysisData, setAnalysisData] = useState({
        filters: null,
        segmentation: null,
        diagnosis: null,
        classification: null
    });

    const nextStep = () => setStep(s => Math.min(s + 1, 6));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));
    const reset = () => {
        setStep(1);
        setImageId(null);
        setOriginalImage(null);
        setAnalysisData({
            filters: null,
            segmentation: null,
            diagnosis: null,
            classification: null
        });
    }

    const updateAnalysis = (key, data) => {
        setAnalysisData(prev => ({ ...prev, [key]: data }));
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return <UploadStep onUpload={(id, img) => { setImageId(id); setOriginalImage(img); nextStep(); }} />;
            case 2:
                return <FilterStep imageId={imageId} onNext={(data) => { updateAnalysis('filters', data); nextStep(); }} />;
            case 3:
                return <SegmentationStep imageId={imageId} onNext={(data) => { updateAnalysis('segmentation', data); nextStep(); }} />;
            case 4:
                return <DiagnosisStep imageId={imageId} onNext={(data) => { updateAnalysis('diagnosis', data); nextStep(); }} />;
            case 5:
                return (
                    <ClassificationStep
                        imageId={imageId}
                        onNext={(data) => {
                            updateAnalysis('classification', data);
                            nextStep();
                        }}
                    />
                );
            case 6:
                return (
                    <ReportStep
                        imageId={imageId}
                        analysisData={analysisData}
                        onReset={reset}
                    />
                );
            default:
                return <UploadStep />;
        }
    }

    if (!isAuthenticated) {
        return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="container py-5 px-4" style={{ maxWidth: '1100px' }}>
            <header className="text-center mb-5 mt-4">
                <div className="d-inline-flex align-items-center gap-2 mb-2">
                    <div className="auth-logo-circle mb-0" style={{ width: '28px', height: '28px' }}></div>
                    <span className="fw-bold tracking-wider text-medical" style={{ fontSize: '0.85rem' }}>CLINICAL INTELLIGENCE</span>
                </div>
                <h1 className="display-5 fw-bold text-dark">RETINA<span className="text-medical">LENS</span></h1>
                <p className="text-secondary lead font-heading" style={{ fontSize: '1.1rem', opacity: 0.8 }}>Advanced AI-Powered Fundus Diagnostic Suite</p>
            </header>

            {/* Medical Stepper Indicator */}
            <div className="medical-stepper mb-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                        key={i}
                        className={`medical-step ${step === i ? 'active' : ''} ${step > i ? 'completed' : ''}`}
                    />
                ))}
            </div>

            <main style={{ minHeight: '60vh' }}>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Global Chatbot Integration */}
            {step > 1 && (
                <Chatbot
                    initialOpen={step === 5}
                    analysisData={analysisData}
                    currentStep={step}
                />
            )}

            <footer className="text-center mt-5 pt-4 border-top opacity-50">
                <p className="small text-secondary">RETINALENS v2.4.0 // PRECISE CLINICAL DIAGNOSIS ENGINE</p>
            </footer>
        </div>
    );
}

export default App;
