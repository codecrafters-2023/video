import React from 'react';
import './PrivacyPolicy.css';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="privacy-container">
            <div className="privacy-header">
                <div className="privacy-header-content">
                    <h1>Privacy Policy</h1>
                    <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="privacy-content">
                <div className="privacy-card">
                    <h2>Introduction</h2>
                    <p>Welcome to VideoChat ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our video chat service.</p>
                    <p>By using our service, you agree to the collection and use of information in accordance with this policy.</p>
                </div>

                <div className="privacy-card">
                    <h2>Information We Collect</h2>
                    <div className="privacy-section">
                        <h3>Personal Information</h3>
                        <p>When you use our service, we may collect:</p>
                        <ul>
                            <li>Your device information (browser type, operating system)</li>
                            <li>IP address for connection purposes</li>
                            <li>Temporary session identifiers</li>
                        </ul>
                    </div>

                    <div className="privacy-section">
                        <h3>Media Information</h3>
                        <p>To provide our video chat service, we request access to:</p>
                        <ul>
                            <li>Your camera feed (video)</li>
                            <li>Your microphone (audio)</li>
                        </ul>
                        <p>This media is transmitted directly between participants and is not stored on our servers.</p>
                    </div>

                    <div className="privacy-section">
                        <h3>Usage Data</h3>
                        <p>We may collect information about how you use our service, including:</p>
                        <ul>
                            <li>Connection times and duration</li>
                            <li>Technical errors or issues</li>
                            <li>Feature usage statistics</li>
                        </ul>
                    </div>
                </div>

                <div className="privacy-card">
                    <h2>How We Use Your Information</h2>
                    <p>We use the information we collect for the following purposes:</p>
                    <ul>
                        <li>To provide and maintain our video chat service</li>
                        <li>To connect you with other users in real-time</li>
                        <li>To improve, test, and monitor the effectiveness of our service</li>
                        <li>To detect and prevent technical issues</li>
                        <li>To comply with legal obligations</li>
                    </ul>
                </div>

                <div className="privacy-card">
                    <h2>Data Security</h2>
                    <p>We implement appropriate technical and organizational measures to protect your personal information:</p>
                    <ul>
                        <li>End-to-end encryption for all video and audio streams</li>
                        <li>Secure socket layer (SSL) technology for data transmission</li>
                        <li>Regular security audits and vulnerability testing</li>
                        <li>Limited data retention policies</li>
                    </ul>
                    <p>Despite these measures, no method of transmission over the Internet is 100% secure.</p>
                </div>

                <div className="privacy-card">
                    <h2>Data Retention</h2>
                    <p>We retain minimal information about your usage:</p>
                    <ul>
                        <li>Connection logs are kept for 30 days for security purposes</li>
                        <li>Technical error reports are kept for 90 days</li>
                        <li>No video or audio content is stored on our servers</li>
                        <li>No personally identifiable information is retained after your session ends</li>
                    </ul>
                </div>

                <div className="privacy-card">
                    <h2>Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>WebRTC:</strong> For real-time communication (audio/video transmission)</li>
                        <li><strong>Socket.IO:</strong> For signaling and connection management</li>
                        <li><strong>Cloud Hosting:</strong> For server infrastructure</li>
                    </ul>
                    <p>These services may collect information as described in their respective privacy policies.</p>
                </div>

                <div className="privacy-card">
                    <h2>Your Privacy Rights</h2>
                    <p>Depending on your location, you may have the following rights:</p>
                    <ul>
                        <li>The right to access personal information we hold about you</li>
                        <li>The right to request correction of inaccurate personal information</li>
                        <li>The right to request deletion of your personal information</li>
                        <li>The right to withdraw consent for data processing</li>
                    </ul>
                    <p>To exercise these rights, please contact us at privacy@videochat.app.</p>
                </div>

                <div className="privacy-card">
                    <h2>Children's Privacy</h2>
                    <p>Our service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13.</p>
                    <p>If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.</p>
                </div>

                <div className="privacy-card">
                    <h2>Changes to This Policy</h2>
                    <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
                    <p>You are advised to review this Privacy Policy periodically for any changes.</p>
                </div>

                <div className="privacy-card">
                    <h2>Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us:</p>
                    <ul>
                        <li>By email: privacy@videochat.app</li>
                        <li>By visiting this page on our website: videochat.app/privacy</li>
                        <li>By mail: Privacy Officer, VideoChat Inc., 123 Tech Street, San Francisco, CA 94103</li>
                    </ul>
                </div>
            </div>

            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-logo">VideoChat</div>
                    <div className="footer-links">
                        <Link href="#features">Features</Link>
                        <Link to={'/PrivacyPolicy'}>Privacy Policy</Link>
                        <Link href="#">Terms of Service</Link>
                        <Link href="#">Contact</Link>
                    </div>
                    <div className="social-links">
                        <Link href="#"><i className="fab fa-facebook"></i></Link>
                        <Link href="#"><i className="fab fa-twitter"></i></Link>
                        <Link href="#"><i className="fab fa-instagram"></i></Link>
                        <Link href="#"><i className="fab fa-linkedin"></i></Link>
                    </div>
                </div>
                <div className="copyright">
                    © {new Date().getFullYear()} VideoChat. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;