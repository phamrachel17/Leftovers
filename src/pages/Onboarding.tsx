import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fridge } from '../components/Fridge';
import { DEFAULT_MAGNETS, PAINTS, paintById } from '../lib/decor';
import { actions } from '../lib/store';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'solo' | 'shared'>('solo');
  const [householdName, setHouseholdName] = useState('');
  const [paint, setPaint] = useState('teal');
  const [sample, setSample] = useState(false);
  const navigate = useNavigate();

  const finish = () => {
    actions.updateSettings({ name: name.trim(), mode, householdName: householdName.trim(), paint, onboarded: true });
    if (sample) actions.loadSampleFridge();
    navigate('/', { replace: true });
  };

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        <div className="onboarding__top">
          <span className="serif wordmark">leftovers</span>
          <span className="mono meta">Step {step + 1} of 3</span>
        </div>
        <div className="progress" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i <= step ? 'is-done' : ''} />
          ))}
        </div>

        {step === 0 && (
          <form
            className="onboarding__body"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(1);
            }}
          >
            <h1 className="serif onboarding__title">
              a little memory for what’s in your <em>fridge.</em>
            </h1>
            <p className="meta">Snap your groceries once. Leftovers remembers them, and nudges you before anything goes soft.</p>
            <label className="field">
              <span className="mono">What should we call you?</span>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
            </label>
            <div className="btn-row btn-row--end">
              <button type="submit" className="btn btn--primary">
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="onboarding__body">
            <h1 className="serif onboarding__title">
              just you, or sharing with <em>others?</em>
            </h1>
            <p className="meta">Leftovers works perfectly solo. You can invite people any time from Profile.</p>
            <div className="choice-list">
              <button type="button" className={`choice ${mode === 'solo' ? 'is-selected' : ''}`} aria-pressed={mode === 'solo'} onClick={() => setMode('solo')}>
                <img src="/food/strawberry.jpg" alt="" className="choice__img" />
                <span className="choice__text">
                  <span className="serif choice__title">Just me</span>
                  <span className="meta">Your own private fridge.</span>
                </span>
              </button>
              <button type="button" className={`choice ${mode === 'shared' ? 'is-selected' : ''}`} aria-pressed={mode === 'shared'} onClick={() => setMode('shared')}>
                <img src="/food/cherries.jpg" alt="" className="choice__img" />
                <span className="choice__text">
                  <span className="serif choice__title">Share a fridge</span>
                  <span className="meta">Roommates, partners, family. You decide what’s shared.</span>
                </span>
              </button>
            </div>
            {mode === 'shared' && (
              <label className="field">
                <span className="mono">Name your household</span>
                <input value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder={name ? `${name}’s apartment` : 'Our apartment'} />
              </label>
            )}
            <div className="btn-row btn-row--between">
              <button type="button" className="link-button" onClick={() => setStep(0)}>
                Back
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding__body onboarding__body--split">
            <div className="onboarding__preview">
              <Fridge settings={{ paint, finish: 'gloss', magnets: DEFAULT_MAGNETS }} eatSoon={[]} />
            </div>
            <div className="stack">
              <h1 className="serif onboarding__title">
                pick your <em>fridge.</em>
              </h1>
              <p className="meta">It’s where your eat-soon notes and magnets live. Change it any time.</p>
              <div className="control__head">
                <span className="mono meta">Paint</span>
                <span className="serif control__value">{paintById(paint).name}</span>
              </div>
              <div className="swatches">
                {PAINTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`swatch ${paint === p.id ? 'is-selected' : ''}`}
                    style={{ background: p.hex }}
                    aria-label={p.name}
                    aria-pressed={paint === p.id}
                    onClick={() => setPaint(p.id)}
                  />
                ))}
              </div>
              <label className="field field--check">
                <input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} />
                <span>Fill it with sample food so I can look around first</span>
              </label>
              <div className="btn-row btn-row--between">
                <button type="button" className="link-button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className="btn btn--primary" onClick={finish}>
                  Open my fridge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
