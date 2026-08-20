import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Activity, Apple, Phone } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    age: 25,
    gender: 'male',
    weightKg: 70,
    heightCm: 175,
    activityLevel: 'moderately_active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignIn, setIsSignIn] = useState(false);
  const [signInPhone, setSignInPhone] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanPhone = formData.phoneNumber.replace(/\D/g, '');

    try {
      const response = await api.post('/users/profile', {
        ...formData,
        phoneNumber: cleanPhone,
        age: Number(formData.age),
        weightKg: Number(formData.weightKg),
        heightCm: Number(formData.heightCm),
      });

      // Save phone to localStorage to auto-login to dashboard
      localStorage.setItem('userPhone', cleanPhone);
      localStorage.setItem('whatsappLink', response.data.whatsappLink);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err.response?.data);
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg || 'Failed to create profile.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanPhone = signInPhone.replace(/\D/g, '');

    try {
      await api.get(`/users/${cleanPhone}`);
      
      localStorage.setItem('userPhone', cleanPhone);
      // Construct whatsapp link for sign in
      const whatsappNumber = '15551995221'; // We should probably fetch this, but hardcoding for now as it's just the bot number
      localStorage.setItem('whatsappLink', `https://wa.me/${whatsappNumber}?text=Hi`);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError('No profile found with this phone number. Please sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--color-primary-dark)' }}>
          Your AI Nutritionist,<br/>Now on Web & WhatsApp
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Create your personalized nutrition profile in seconds and start tracking your diet effortlessly with NutriBot.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div className="card flex-center" style={{ flexDirection: 'column', textAlign: 'center', gap: '1rem' }}>
          <div style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '1rem', borderRadius: '50%' }}>
            <Apple size={32} />
          </div>
          <h3>Personalized Diet</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Get AI-tailored calorie and macronutrient targets based on your unique body metrics.</p>
        </div>
        <div className="card flex-center" style={{ flexDirection: 'column', textAlign: 'center', gap: '1rem' }}>
          <div style={{ color: 'var(--color-accent)', background: '#dbeafe', padding: '1rem', borderRadius: '50%' }}>
            <Phone size={32} />
          </div>
          <h3>WhatsApp Integration</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Log your meals simply by sending a text or voice note to NutriBot on WhatsApp.</p>
        </div>
        <div className="card flex-center" style={{ flexDirection: 'column', textAlign: 'center', gap: '1rem' }}>
          <div style={{ color: '#f59e0b', background: '#fef3c7', padding: '1rem', borderRadius: '50%' }}>
            <Activity size={32} />
          </div>
          <h3>Real-time Tracking</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Monitor your daily progress instantly on this beautiful dashboard.</p>
        </div>
      </div>

      <div className="glass" style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>{isSignIn ? 'Sign In' : 'Create Your Profile'}</h2>
          <button 
            type="button" 
            onClick={() => { setIsSignIn(!isSignIn); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSignIn ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </button>
        </div>
        
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {isSignIn ? (
          <form onSubmit={handleSignIn}>
            <div className="input-group">
              <label>WhatsApp Phone Number (with country code, no +)</label>
              <input required type="text" className="input-field" value={signInPhone} onChange={(e) => setSignInPhone(e.target.value)} placeholder="15551234567" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input required type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} placeholder="John Doe" />
            </div>

            <div className="input-group">
              <label>WhatsApp Phone Number (with country code, no +)</label>
              <input required type="text" name="phoneNumber" className="input-field" value={formData.phoneNumber} onChange={handleChange} placeholder="15551234567" />
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Age</label>
                <input required type="number" name="age" className="input-field" value={formData.age} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select name="gender" className="input-field" value={formData.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Weight (kg)</label>
                <input required type="number" name="weightKg" className="input-field" value={formData.weightKg} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Height (cm)</label>
                <input required type="number" name="heightCm" className="input-field" value={formData.heightCm} onChange={handleChange} />
              </div>
            </div>

            <div className="input-group">
              <label>Activity Level</label>
              <select name="activityLevel" className="input-field" value={formData.activityLevel} onChange={handleChange}>
                <option value="sedentary">Sedentary (little to no exercise)</option>
                <option value="lightly_active">Light (exercise 1-3 days/week)</option>
                <option value="moderately_active">Moderate (exercise 3-5 days/week)</option>
                <option value="very_active">Active (exercise 6-7 days/week)</option>
                <option value="extra_active">Very Active (hard exercise daily)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Creating Profile...' : 'Get My Nutrition Plan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
