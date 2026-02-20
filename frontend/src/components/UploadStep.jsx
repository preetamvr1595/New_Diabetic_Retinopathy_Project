import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaFileMedical } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const UploadStep = ({ onUpload }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        setPreview(URL.createObjectURL(file));
        setUploading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await api.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTimeout(() => {
                onUpload(res.data.id, res.data.base64);
            }, 1000);
        } catch (err) {
            console.error(err);
            alert("Upload failed. Please ensure the backend is running and you have a stable connection.");
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="medical-card p-5 text-center mx-auto position-relative overflow-hidden"
            style={{ maxWidth: '800px' }}
        >
            <div className="position-relative" style={{ zIndex: 1 }}>
                <div className="mb-5">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-soft-blue text-medical rounded-4 d-inline-flex p-4 mb-4"
                    >
                        <FaFileMedical size={48} />
                    </motion.div>
                    <h2 className="text-dark display-6 fw-bold font-heading">Secure Fundus Upload</h2>
                    <p className="text-secondary lead px-4 opacity-75">Transfer DICOM or JPEGRetinal specimen for comprehensive AI analysis.</p>
                </div>

                <div
                    {...getRootProps()}
                    className={`border-2 rounded-4 p-5 cursor-pointer transition-all ${isDragActive
                        ? 'border-medical bg-soft-blue shadow-lg'
                        : 'border-dashed border-medical bg-light bg-opacity-50'
                        }`}
                    style={{
                        minHeight: '340px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <input {...getInputProps()} />
                    <AnimatePresence mode="wait">
                        {preview ? (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="position-relative"
                            >
                                <img src={preview} alt="Preview" className="img-fluid rounded-4 shadow-sm" style={{ maxHeight: '300px' }} />
                                <div className="mt-4 text-medical fw-bold d-flex align-items-center justify-content-center gap-2">
                                    <FaCloudUploadAlt /> Click to re-upload image
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="d-flex flex-column align-items-center"
                            >
                                <FaCloudUploadAlt size={72} className={`mb-4 transition-all ${isDragActive ? 'text-medical' : 'text-medical opacity-30'}`} />
                                <h4 className="text-dark fw-bold font-heading">Drag & Drop Specimen</h4>
                                <p className="text-secondary small mb-0">High-Resolution Fundus Imaging Required</p>
                                <div className="badge bg-soft-blue text-medical px-4 py-2 rounded-pill mt-5 fw-bold">
                                    <i className="bi bi-shield-lock-fill me-2"></i>HIPAA PROTOCOL ACTIVE
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {uploading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-5"
                    >
                        <div className="progress rounded-pill bg-light" style={{ height: '8px' }}>
                            <motion.div
                                className="progress-bar bg-medical"
                                role="progressbar"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <p className="text-medical mt-4 small fw-bold tracking-widest text-uppercase">
                            SECURE ARCHIVING & PRE-SCREENING...
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default UploadStep;
