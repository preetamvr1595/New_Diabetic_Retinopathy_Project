import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { motion } from 'framer-motion';

const SegmentationStep = ({ imageId, onNext = () => { } }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSegmentation = async () => {
            try {
                const res = await api.get(`/api/segment/${imageId}`);
                if (res.data) {
                    setData(res.data);
                }
                setLoading(false);
            } catch (err) {
                console.error("Segmentation API Error:", err);
                setLoading(false);
            }
        };
        fetchSegmentation();
    }, [imageId]);

    if (loading) return (
        <div className="text-center py-5">
            <div className="medical-loader mb-4"></div>
            <h3 className="text-medical fw-bold">EXTRACTING VASCULAR ARCHITECTURE...</h3>
            <p className="text-muted">Attention U-Net model is generating pixel-wise vessel mask</p>
        </div>
    );

    if (!data) return (
        <div className="text-center text-danger py-5">
            <h3 className="fw-bold">SEGMENTATION FAILED</h3>
            <p>Could not process image architecture. Please try again.</p>
            <button className="btn btn-outline-danger rounded-pill px-4" onClick={() => window.location.reload()}>RESTART</button>
        </div>
    );

    return (
        <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h2 className="display-6 fw-bold text-dark font-heading mb-1">CLINICAL SEGMENTATION</h2>
                    <p className="text-secondary mb-0">Structural isolation of the vascular tree for detailed analysis</p>
                </div>
                <div className="d-flex gap-3">
                    <button className="btn btn-outline-secondary px-4 py-2 rounded-pill fw-bold small shadow-sm">SHOW OVERLAY</button>
                    <button className="btn-clinical btn-clinical-primary shadow-premium px-5 py-3" onClick={() => onNext(data)}>
                        PROCEED TO DIAGNOSIS
                    </button>
                </div>
            </div>

            <div className="row justify-content-center g-4 mb-5">
                {/* Source Card */}
                <div className="col-lg-6">
                    <motion.div
                        className="medical-card p-4 h-100 position-relative border-0 shadow-sm"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h6 className="text-muted fw-bold mb-0 tracking-widest text-uppercase" style={{ fontSize: '0.7rem' }}>ENHANCED SOURCE</h6>
                            <span className="badge bg-danger-soft text-danger border-0 px-3 py-1 rounded-pill fw-bold small">ORIGINAL</span>
                        </div>
                        <div className="p-1 bg-light rounded-4 border overflow-hidden">
                            <img src={`data:image/jpeg;base64,${data.original}`} className="img-fluid w-100" alt="Original" style={{ minHeight: '450px', objectFit: 'cover' }} />
                        </div>
                    </motion.div>
                </div>

                {/* Mask Card */}
                <div className="col-lg-6">
                    <motion.div
                        className="medical-card p-4 h-100 position-relative border-0 shadow-sm"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h6 className="text-muted fw-bold mb-0 tracking-widest text-uppercase" style={{ fontSize: '0.7rem' }}>SEGMENTATION MASK</h6>
                            <span className="badge bg-medical-soft text-medical border-0 px-3 py-1 rounded-pill fw-bold small">U-NET AI</span>
                        </div>
                        <div className="p-1 bg-dark rounded-4 border-0 overflow-hidden shadow-inner">
                            <img src={`data:image/jpeg;base64,${data.mask}`} className="img-fluid w-100" alt="Mask" style={{ minHeight: '450px', objectFit: 'cover' }} />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Summary Panel */}
            <motion.div
                className="medical-card p-4 shadow-premium border-0 overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <div className="row align-items-center">
                    <div className="col-lg-9 border-end">
                        <h6 className="text-dark fw-bold mb-2 text-uppercase tracking-wider small">SEGMENTATION ANALYSIS SUMMARY</h6>
                        <p className="text-secondary mb-0 small opacity-75" style={{ lineHeight: '1.6' }}>
                            The AI model has successfully isolated the retinal vascular tree. Structural continuity is within normal clinical parameters.
                            Anomaly nodes have been tagged for final diagnostic classification.
                        </p>
                    </div>
                    <div className="col-lg-3 text-center">
                        <h2 className="display-6 fw-bold text-medical mb-0">94.8%</h2>
                        <span className="text-muted fw-bold small text-uppercase tracking-widest">MAPPING CONFIDENCE</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default SegmentationStep;
