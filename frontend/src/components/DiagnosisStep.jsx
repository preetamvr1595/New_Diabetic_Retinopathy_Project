import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api/axiosConfig';

const DiagnosisStep = ({ imageId, onNext }) => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDiagnosis = async () => {
            try {
                const res = await api.get(`/api/classify/${imageId}`);
                setResult(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchDiagnosis();
    }, [imageId]);

    if (loading) return (
        <div className="text-center py-5">
            <div className="medical-loader mb-4"></div>
            <h3 className="text-medical fw-bold">ANALYZING RETINAL BIOMARKERS...</h3>
            <p className="text-muted">Synthesizing segmentation data with classification logic</p>
        </div>
    );

    if (!result) return (
        <div className="text-center text-danger py-5">
            <h3 className="fw-bold">DIAGNOSIS ERROR</h3>
            <p>Could not interpret findings. Please try again.</p>
            <button className="btn btn-outline-danger rounded-pill px-4" onClick={() => window.location.reload()}>
                RESTART ANALYSIS
            </button>
        </div>
    );

    const isDiabetic = result.label !== 'No_DR';

    return (
        <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="display-6 fw-bold text-dark font-heading mb-1">IMAGE DIAGNOSIS</h2>
                    <p className="text-secondary mb-0">Automated detection of diabetic retinopathy pathologies</p>
                </div>
                <button className="btn-clinical btn-clinical-primary shadow-premium px-5 py-3" onClick={() => onNext(result)}>
                    PROCEED TO CLASSIFICATION
                </button>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <motion.div
                        className="medical-card p-5 border-0 shadow-premium position-relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'white' }}
                    >
                        <div className="text-center mb-5">
                            <div className={`status-dot mb-4 ${isDiabetic ? 'bg-danger shadow-danger' : 'bg-success shadow-success'}`} style={{ width: '16px', height: '16px' }}></div>
                            <h2 className="display-5 fw-bold font-heading mb-0 text-dark">DIAGNOSTIC VERDICT</h2>

                            <div className={`mt-4 d-inline-block px-5 py-3 rounded-pill fw-bold font-heading border-0 shadow-premium ${isDiabetic ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`} style={{ fontSize: '1.25rem', letterSpacing: '0.05em' }}>
                                {isDiabetic ? 'DR DETECTED' : 'NO DR DETECTED'}
                            </div>
                        </div>

                        <div className="mx-auto" style={{ maxWidth: '600px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="text-muted fw-bold small text-uppercase tracking-widest">RETINACORE CONFIDENCE INDEX</span>
                                <span className="text-medical fw-bold font-heading">{(result.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="dt-progress-bar w-100 mb-5" style={{ height: '8px' }}>
                                <motion.div
                                    className="dt-progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${result.confidence * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>

                            <div className="p-5 rounded-4 border-0 bg-light position-relative overflow-hidden mb-4 shadow-inner">
                                <div className="text-center">
                                    <h6 className="text-muted fw-bold mb-4 tracking-widest text-uppercase" style={{ fontSize: '0.7rem' }}>CLINICAL OBSERVATION</h6>
                                    <p className="text-secondary mb-0" style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
                                        Pathology detection stage completed. The AI model has scanned the primary vascular regions and
                                        identified potential markers consistent with <strong className="text-dark">{isDiabetic ? 'Diabetic Retinopathy' : 'No DR Detected'}</strong>.
                                        Follow clinical protocol for secondary verification.
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex justify-content-center gap-4 text-muted small fw-bold tracking-widest text-uppercase" style={{ fontSize: '0.65rem' }}>
                                <span className="d-flex align-items-center gap-2">
                                    <i className="bi bi-shield-check-fill text-medical"></i> AI VALIDATED
                                </span>
                                <span className="d-flex align-items-center gap-2">
                                    <i className="bi bi-lock-fill text-medical"></i> DICOM SECURE
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default DiagnosisStep;
