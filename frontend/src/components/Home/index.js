import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>Connect <span className="highlight">Face to Face</span></h1>
                        <p className="subtitle">Instant video chat with people around the world. No sign-up required.</p>
                        <div className="cta-buttons">
                            <Link to="/chat" className="cta-button primary">Start Chatting Now</Link>
                            <Link to={"#features"} className="cta-button secondary">Learn More</Link>
                        </div>
                    </div>
                    <div className="hero-image">
                        <div className="video-chat-preview">
                            <div className="user-card local">
                                <div className="user-avatar"></div>
                                <div className="user-name">You</div>
                            </div>
                            <div style={{height: '300px',position: 'relative'}}>
                                <div className="connection-line"></div>
                            </div>
                            <div className="user-card remote">
                                <div className="user-avatar"></div>
                                <div className="user-name">Partner</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <h2>Why Choose <span className="highlight">VideoChat</span></h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <h3>Secure & Private</h3>
                        <p>End-to-end encryption ensures your conversations stay private.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-bolt"></i>
                        </div>
                        <h3>Lightning Fast</h3>
                        <p>Low latency connections for seamless conversations.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-globe"></i>
                        </div>
                        <h3>Global Reach</h3>
                        <p>Connect with people from all over the world instantly.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <i className="fas fa-user-friends"></i>
                        </div>
                        <h3>Meet New People</h3>
                        <p>Discover interesting individuals with shared interests.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works">
                <h2>How It <span className="highlight">Works</span></h2>
                <div className="steps-container">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Start Chatting</h3>
                        <p>Click the Start Chatting button to begin</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Allow Access</h3>
                        <p>Grant camera and microphone permissions</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Get Connected</h3>
                        <p>We'll find you a partner instantly</p>
                    </div>
                    <div className="step">
                        <div className="step-number">4</div>
                        <h3>Chat & Connect</h3>
                        <p>Start your conversation with a new friend</p>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <h2>What People <span className="highlight">Say</span></h2>
                <div className="testimonial-cards">
                    <div className="testimonial">
                        <div className="quote">"I've met amazing people from different cultures. This app changed how I see the world!"</div>
                        <div className="author">
                            <div className="author-avatar"></div>
                            <div className="author-info">
                                <div className="author-name">Sarah J.</div>
                                <div className="author-location">New York, USA</div>
                            </div>
                        </div>
                    </div>
                    <div className="testimonial">
                        <div className="quote">"The video quality is incredible. It feels like we're in the same room!"</div>
                        <div className="author">
                            <div className="author-avatar"></div>
                            <div className="author-info">
                                <div className="author-name">David M.</div>
                                <div className="author-location">London, UK</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="final-cta">
                <h2>Ready to <span className="highlight">Connect?</span></h2>
                <p>Join thousands of users having meaningful conversations right now</p>
                <Link to="/chat" className="cta-button primary large">Start Free Video Chat</Link>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-logo">VideoChat</div>
                    <div className="footer-links">
                        <Link href="#features">Features</Link>
                        <Link to={'/PrivacyPolicy'}>Privacy Policy</Link>
                        <Link to={'/terms'}>Terms of Service</Link>
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

export default HomePage;