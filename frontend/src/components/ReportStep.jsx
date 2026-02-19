import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ReportStep = ({ imageId, analysisData, onReset }) => {
    const [view, setView] = useState('doctor'); // 'doctor' or 'patient'
    const { classification } = analysisData;

    if (!classification) return null;

    const isDiabetic = classification.label !== 'No_DR';
    const severityLabel = classification.label.replace(/_/g, ' ');

    const doctorContent = {
        summary: {
            condition: isDiabetic ? severityLabel : 'No Apparent Diabetic Retinopathy',
            markers: isDiabetic
                ? 'Presence of microaneurysms, hemorrhages, or exudates detected within the retinal field.'
                : 'No microaneurysms, hemorrhages, or exudates detected within the visible retinal field.'
        },
        actions: [
            'Baseline fundus photography for longitudinal comparison.',
            'Review systemic metabolic parameters (HbA1c, BP, Lipids).',
            'Standard intraocular pressure (IOP) screening.',
            'Patient education on the importance of annual screening.'
        ],
        suggestions: isDiabetic ? [
            'Immediate referral to a Vitreoretinal Specialist for further evaluation.',
            'Consider Optical Coherence Tomography (OCT) to rule out macular edema.',
            'Maintain strict glycemic control to prevent further vascular damage.',
            'Monitor blood pressure and lipid profile closely.'
        ] : [
            'No ocular intervention indicated at this time.',
            'Optimize glycemic control to maintain retinal health.',
            'Monitor for any new systemic cardiovascular risk factors.'
        ],
        followUp: isDiabetic ? 'Suggested follow-up interval: 3-6 months for clinical monitoring.' : 'Suggested follow-up interval: 12 months for routine diabetic eye screening.'
    };

    const patientContent = {
        meaning: isDiabetic
            ? 'The AI scan has detected signs of diabetic changes in your eyes. This is a common complication of diabetes but requires medical attention to protect your vision.'
            : 'Great news! The AI scan shows no signs of Diabetic Retinopathy. This means diabetes has not caused any visible damage to the blood vessels in your eyes at this time.',
        actions: [
            'Continue your regular eye exams once a year.',
            'Keep this report for your family doctor or health records.',
            'Stay on track with your current diabetes management plan.'
        ],
        lifestyle: [
            'Blood Sugar: Keep it within your target range to protect your eyes.',
            'Diet: A balanced, low-sugar diet helps prevent future eye problems.',
            'Exercise: Regular walking or activity supports good circulation.',
            'No Smoking: Avoiding tobacco is one of the best ways to save your sight.'
        ],
        tips: [
            "Don't skip eye exams even if your vision feels 100% fine.",
            'Wear sunglasses to protect your eyes from sun damage.',
            'Take a break from screens (20-20-20 rule) to reduce strain.'
        ],
        reassurance: 'You are doing a great job! By keeping your health in check now, you are making the best choice for your future vision. Stay positive and consistent!'
    };

    return (
        <div className="container-fluid px-0 pb-5">
            <motion.div
                className="medical-card p-5 border-0 shadow-premium mb-5 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'white' }}
            >
                <div className="auth-logo-circle mx-auto mb-4" style={{ width: '60px', height: '60px' }}></div>
                <h2 className="display-6 fw-bold text-dark font-heading mb-2">CLINICAL ANALYSIS COMPLETE</h2>
                <p className="text-secondary tracking-widest text-uppercase small opacity-75">Retinal Diagnostic Chain Validated // Secure Clinical Report</p>

                <div className="d-flex justify-content-center gap-3 mt-5">
                    <button className="btn btn-outline-secondary px-5 py-3 rounded-pill fw-bold small shadow-sm" onClick={() => window.print()}>
                        PRINT REPORT
                    </button>
                    <button className="btn-clinical btn-clinical-primary shadow-premium px-5 py-3" onClick={onReset}>
                        NEW CASE STUDY
                    </button>
                </div>
            </motion.div>

            <div className="d-flex justify-content-center gap-3 mb-5">
                <button
                    className={`btn px-5 py-2 rounded-pill fw-bold tracking-widest ${view === 'doctor' ? 'btn-clinical-primary shadow-premium' : 'btn-outline-secondary opacity-75'}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setView('doctor')}
                >
                    DOCTOR VIEW
                </button>
                <button
                    className={`btn px-5 py-2 rounded-pill fw-bold tracking-widest ${view === 'patient' ? 'btn-clinical-primary shadow-premium' : 'btn-outline-secondary opacity-75'}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setView('patient')}
                >
                    PATIENT VIEW
                </button>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-10 col-xl-9">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={view}
                            initial={{ opacity: 0, x: view === 'doctor' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: view === 'doctor' ? 20 : -20 }}
                            className="medical-card p-5 border-0 shadow-premium"
                            style={{ background: 'white', borderTop: `6px solid ${view === 'doctor' ? 'var(--medical-primary)' : '#ff4081'}` }}
                        >
                            {view === 'doctor' ? (
                                <div className="report-content doctor-view">
                                    <h4 className="fw-bold text-dark mb-5 text-center font-heading">Doctor Prescription & Clinical Recommendations</h4>

                                    <section className="mb-5">
                                        <h6 className="text-medical fw-bold mb-3 tracking-wider small">1. Clinical Assessment Summary</h6>
                                        <ul className="list-unstyled space-y-3 ps-3">
                                            <li className="text-secondary small d-flex gap-2">
                                                <span className="fw-bold text-dark">• Detected condition:</span> {doctorContent.summary.condition}
                                            </li>
                                            <li className="text-secondary small d-flex gap-2">
                                                <span className="fw-bold text-dark">• Visible retinal markers:</span> {doctorContent.summary.markers}
                                            </li>
                                            <li className="text-danger small fw-bold mt-2">
                                                Note: These findings are AI-assisted and require clinical confirmation by a licensed ophthalmologist.
                                            </li>
                                        </ul>
                                    </section>

                                    <section className="mb-5">
                                        <h6 className="text-medical fw-bold mb-3 tracking-wider small">2. Recommended Diagnostic Actions</h6>
                                        <ul className="list-unstyled space-y-2 ps-3">
                                            {doctorContent.actions.map((act, i) => (
                                                <li key={i} className="text-secondary small d-flex gap-2">• {act}</li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="mb-5">
                                        <h6 className="text-medical fw-bold mb-3 tracking-wider small">3. Treatment & Management Suggestions</h6>
                                        <ul className="list-unstyled space-y-2 ps-3">
                                            {doctorContent.suggestions.map((sug, i) => (
                                                <li key={i} className="text-secondary small d-flex gap-2">• {sug}</li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="mb-5">
                                        <h6 className="text-medical fw-bold mb-3 tracking-wider small">4. Follow-Up Schedule</h6>
                                        <ul className="list-unstyled ps-3">
                                            <li className="text-secondary small">• {doctorContent.followUp}</li>
                                            <li className="text-secondary small mt-1">• Shorter interval if systemic risk factors (diabetes, hypertension) are poorly controlled.</li>
                                        </ul>
                                    </section>

                                    <div className="p-4 rounded-4 bg-light border-0 shadow-inner mt-5">
                                        <h6 className="text-danger fw-bold mb-2 tracking-widest text-uppercase" style={{ fontSize: '0.7rem' }}>CLINICAL DISCLAIMER (MANDATORY)</h6>
                                        <p className="text-secondary mb-0 small opacity-75" style={{ lineHeight: '1.6' }}>
                                            This prescription is an AI-assisted decision support output. It is intended to assist medical professionals and does NOT replace professional medical judgment, physical examination, or formal clinical diagnosis.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="report-content patient-view">
                                    <h4 className="fw-bold mb-5 text-center font-heading" style={{ color: '#ff4081' }}>Patient Guidance & Next Steps</h4>

                                    <section className="mb-5">
                                        <h6 className="fw-bold mb-3 tracking-wider small" style={{ color: '#ff4081' }}>1. What This Result Means</h6>
                                        <p className="text-secondary small ps-3">{patientContent.meaning}</p>
                                    </section>

                                    <section className="mb-5">
                                        <h6 className="fw-bold mb-3 tracking-wider small" style={{ color: '#ff4081' }}>2. What You Should Do Now</h6>
                                        <ul className="list-unstyled space-y-2 ps-3">
                                            {patientContent.actions.map((act, i) => (
                                                <li key={i} className="text-secondary small d-flex gap-2">• {act}</li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="mb-5">
                                        <h6 className="fw-bold mb-3 tracking-wider small" style={{ color: '#ff4081' }}>3. Lifestyle & Health Recommendations</h6>
                                        <ul className="list-unstyled space-y-2 ps-3">
                                            {patientContent.lifestyle.map((ls, i) => (
                                                <li key={i} className="text-secondary small d-flex gap-2">• {ls}</li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="mb-5">
                                        <h6 className="fw-bold mb-3 tracking-wider small" style={{ color: '#ff4081' }}>4. Eye Care Tips</h6>
                                        <ul className="list-unstyled space-y-2 ps-3">
                                            {patientContent.tips.map((tip, i) => (
                                                <li key={i} className="text-secondary small d-flex gap-2">• {tip}</li>
                                            ))}
                                        </ul>
                                    </section>

                                    <section className="mb-5">
                                        <h6 className="fw-bold mb-3 tracking-wider small text-success">5. Reassurance Message</h6>
                                        <p className="text-secondary small ps-3">{patientContent.reassurance}</p>
                                    </section>

                                    <div className="p-4 rounded-4 border-0 shadow-inner mt-5" style={{ background: 'rgba(255, 64, 129, 0.05)' }}>
                                        <h6 className="fw-bold mb-2 tracking-widest text-uppercase" style={{ fontSize: '0.7rem', color: '#ff4081' }}>PATIENT DISCLAIMER</h6>
                                        <p className="text-secondary mb-0 small opacity-75" style={{ lineHeight: '1.6' }}>
                                            This information is for educational purposes only and is intended to support your conversation with your doctor. It is not a final diagnosis or a substitute for professional medical advice.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ReportStep;
