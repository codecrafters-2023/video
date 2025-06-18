import React from 'react';
import './TermsOfService.css';

const TermsOfService = () => {
    return (
        <div className="tos-container">
            <div className="tos-header">
                <div className="tos-header-content">
                    <h1>Terms of Service</h1>
                    <p>Effective: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="tos-content">
                <div className="tos-card">
                    <h2>1. Acceptance of Terms</h2>
                    <p>By accessing or using the VideoChat service ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use our Service.</p>
                    <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>
                </div>

                <div className="tos-card">
                    <h2>2. Service Description</h2>
                    <p>VideoChat provides a platform for real-time video communication between users. Our Service enables:</p>
                    <ul>
                        <li>Anonymous video chat connections between users</li>
                        <li>Real-time audio and video transmission</li>
                        <li>Temporary connections that end when either party disconnects</li>
                    </ul>
                    <p>We do not guarantee continuous, uninterrupted access to our Service.</p>
                </div>

                <div className="tos-card">
                    <h2>3. User Responsibilities</h2>
                    <p>As a user of VideoChat, you agree to:</p>
                    <ul>
                        <li>Use the Service only for lawful purposes</li>
                        <li>Not engage in any behavior that is harmful, abusive, or harassing</li>
                        <li>Not transmit any content that is illegal, obscene, threatening, or defamatory</li>
                        <li>Not impersonate any person or entity</li>
                        <li>Not attempt to gain unauthorized access to our systems</li>
                        <li>Comply with all applicable laws and regulations</li>
                    </ul>
                    <p>We reserve the right to terminate your access to the Service for violations of these Terms.</p>
                </div>

                <div className="tos-card">
                    <h2>4. Age Requirements</h2>
                    <p>You must be at least 13 years old to use our Service. If you are under 18, you confirm that you have permission from your parent or legal guardian to use the Service.</p>
                    <p>By using the Service, you represent and warrant that you meet these age requirements.</p>
                </div>

                <div className="tos-card">
                    <h2>5. Privacy</h2>
                    <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using our Service, you consent to our collection and use of information as described in the Privacy Policy.</p>
                    <p>Please note that while we implement security measures, we cannot guarantee absolute security for information transmitted through the internet.</p>
                </div>

                <div className="tos-card">
                    <h2>6. Intellectual Property</h2>
                    <p>All content and materials available on the Service, including but not limited to text, graphics, logos, and software, are the property of VideoChat or its licensors and are protected by intellectual property laws.</p>
                    <p>You are granted a limited, non-exclusive, non-transferable license to use the Service for personal, non-commercial purposes.</p>
                </div>

                <div className="tos-card">
                    <h2>7. User Content</h2>
                    <p>You retain ownership of any content you transmit through the Service. By using the Service, you grant VideoChat a non-exclusive, worldwide, royalty-free license to transmit your content as necessary to provide the Service.</p>
                    <p>You are solely responsible for the content you transmit through the Service. We do not monitor or control user content but reserve the right to remove content that violates these Terms.</p>
                </div>

                <div className="tos-card">
                    <h2>8. Prohibited Conduct</h2>
                    <p>When using the Service, you must not:</p>
                    <ul>
                        <li>Violate any applicable laws or regulations</li>
                        <li>Engage in harassment, bullying, or hate speech</li>
                        <li>Transmit sexually explicit content</li>
                        <li>Attempt to exploit minors in any way</li>
                        <li>Distribute viruses or malicious software</li>
                        <li>Interfere with the operation of the Service</li>
                        <li>Attempt to reverse engineer, decompile, or disassemble any part of the Service</li>
                    </ul>
                </div>

                <div className="tos-card">
                    <h2>9. Disclaimers</h2>
                    <p>The Service is provided "as is" and "as available" without warranties of any kind. We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
                    <p>We do not warrant that the Service will be uninterrupted, error-free, or secure.</p>
                </div>

                <div className="tos-card">
                    <h2>10. Limitation of Liability</h2>
                    <p>To the maximum extent permitted by law, VideoChat and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:</p>
                    <ul>
                        <li>Your access to or use of or inability to access or use the Service</li>
                        <li>Any conduct or content of any third party on the Service</li>
                        <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                    </ul>
                </div>

                <div className="tos-card">
                    <h2>11. Termination</h2>
                    <p>We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                    <p>All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
                </div>

                <div className="tos-card">
                    <h2>12. Governing Law</h2>
                    <p>These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.</p>
                    <p>Any disputes arising from these Terms will be resolved in the state or federal courts located in San Francisco County, California.</p>
                </div>

                <div className="tos-card">
                    <h2>13. Contact Information</h2>
                    <p>If you have any questions about these Terms, please contact us:</p>
                    <ul>
                        <li>By email: legal@videochat.app</li>
                        <li>By visiting this page on our website: videochat.app/terms</li>
                        <li>By mail: Legal Department, VideoChat Inc., 123 Tech Street, San Francisco, CA 94103</li>
                    </ul>
                </div>
            </div>

            <div className="tos-footer">
                <p>© {new Date().getFullYear()} VideoChat. All rights reserved.</p>
                <div className="tos-links">
                    <a href="/">Home</a>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/contact">Contact Us</a>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;