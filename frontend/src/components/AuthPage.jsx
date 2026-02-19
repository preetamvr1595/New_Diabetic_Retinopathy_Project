import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        email: 'clinician@hospital.org',
        password: '••••••••'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Emulate login/signup
        onLogin();
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-container">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                className="auth-card"
            >
                <div className="auth-header">
                    <div className="auth-logo-circle"></div>
                    <h1 className="font-heading">RETINALENS</h1>
                    <p>Advanced Clinical Diagnostic Platform</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        SIGN IN
                    </button>
                    <button
                        className={`auth-tab ${!isLogin ? 'active signup' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        CREATE ACCOUNT
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                key="signup-fields"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="form-group"
                            >
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Dr. John Doe"
                                    className="form-control-medical"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="clinician@hospital.org"
                            className="form-control-medical"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            className="form-control-medical"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-auth-submit"
                        style={{ backgroundColor: isLogin ? 'var(--medical-primary)' : 'var(--medical-danger)' }}
                    >
                        {isLogin ? 'Sign In to Dashboard' : 'Create Account & Enter'}
                    </button>
                </form>

                <div className="auth-footer text-center mt-4">
                    <p className="small text-muted fw-semibold">
                        <i className="bi bi-shield-lock-fill me-2 text-medical"></i>
                        HIPAA COMPLIANT // SECURE DATA SHIELD
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPage;
