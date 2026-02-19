import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { motion } from 'framer-motion';

const ClassificationStep = ({ imageId, onNext }) => {
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchClassification = async () => {
            const res = await api.get(`/api/classify/${imageId}`);
            setResult(res.data);
        };
        fetchClassification();
    }, [imageId]);

    if (!result) return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="medical-loader mb-4"></div>
            <p className="text-medical fw-bold tracking-widest text-uppercase small">Computing Severity Vectors...</p>
        </div>
    );

    const severityMap = {
        'No_DR': { label: 'HEALTHY RETINA', color: 'var(--medical-success)', bg: 'rgba(16, 185, 129, 0.05)' },
        'Mild_DR': { label: 'MILD NPDR', color: 'var(--medical-warning)', bg: 'rgba(245, 158, 11, 0.05)' },
        'Moderate_DR': { label: 'MODERATE NPDR', color: '#f97316', bg: 'rgba(249, 115, 22, 0.05)' },
        'Severe_DR': { label: 'SEVERE NPDR', color: 'var(--medical-danger)', bg: 'rgba(244, 63, 94, 0.05)' },
        'Proliferate_DR': { label: 'PROLIFERATIVE DR', color: '#be123c', bg: 'rgba(190, 18, 60, 0.05)' }
    };

    const current = severityMap[result.label] || {
        label: result.label?.replace(/_/g, ' ') || 'UNKNOWN CATEGORY',
        color: 'var(--medical-primary)',
        bg: 'rgba(0, 123, 255, 0.05)'
    };

    return (
        <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="display-6 fw-bold text-dark font-heading mb-1">CLASSIFICATION REPORT</h2>
                    <p className="text-secondary mb-0">Final clinical grading based on multimodal feature synthesis</p>
                </div>
                <div className="d-flex gap-3">
                    <button className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-bold small shadow-sm" onClick={() => window.location.reload()}>
                        <i className="bi bi-arrow-repeat me-2"></i> NEW ANALYSIS
                    </button>
                    <button className="btn-clinical btn-clinical-primary shadow-premium px-5 py-3" onClick={() => onNext(result)}>
                        GENERATE REPORT <i className="bi bi-file-earmark-pdf-fill ms-2"></i>
                    </button>
                </div>
            </div>

            <div className="row justify-content-center g-4 mb-5">
                <div className="col-lg-10">
                    <motion.div
                        className="medical-card p-5 text-center border-0 shadow-premium"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'white' }}
                    >
                        <div className="mb-4">
                            <span className={`badge border-0 px-4 py-2 rounded-pill fw-bold shadow-sm ${current.color.includes('success') ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`} style={{ letterSpacing: '0.05em' }}>
                                FINAL CLINICAL GRADING
                            </span>
                        </div>

                        <h1 className="display-3 fw-bold font-heading mb-5" style={{ color: current.color }}>
                            {current.label}
                        </h1>

                        <div className="mx-auto" style={{ maxWidth: '600px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-muted fw-bold small text-uppercase tracking-widest">CONFIDENCE SCORE</span>
                                <span className="fw-bold font-heading" style={{ color: current.color }}>
                                    {(result.confidence * 100).toFixed(2)}%
                                </span>
                            </div>
                            <div className="dt-progress-bar w-100 mb-5" style={{ height: '10px' }}>
                                <motion.div
                                    className="dt-progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.confidence * 100}%` }}
                                    style={{ backgroundColor: current.color }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>

                            <div className="p-4 bg-light rounded-4 border-0 mb-4 shadow-inner">
                                <p className="text-secondary mb-0 small opacity-75" style={{ lineHeight: '1.6' }}>
                                    The retinal analysis engine has cross-verified all structural biomarkers and vascular continuity.
                                    The resulting classification reflects the highest probability outcome within the validated severance matrix.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ClassificationStep;
