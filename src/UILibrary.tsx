import { useState } from 'react';
import { TextInput } from './components/ui/TextInput';
import { TextArea } from './components/ui/TextArea';
import { OptionButton } from './components/ui/OptionButton';
import { MultiSelect } from './components/ui/MultiSelect';
import { PanelHeader } from './components/ui/PanelHeader';
import {
  Save, Lock, Unlock, Share2, Settings, PanelLeftClose, PanelRightClose,
  ChevronRight, ChevronDown, Eye, EyeOff, Search, X, Plus, Minus,
  MousePointer2, Hand, Ruler, PenTool, Layers, SlidersHorizontal, LayoutGrid,
  Grid3x3, Magnet, ZoomIn, ZoomOut, GripVertical,
  FileText, Calculator, Package, Clock,
} from 'lucide-react';
import { BrandMark } from './components/TitleBar/NarveoLogo';

export function UILibrary() {
  const [textVal, setTextVal] = useState('123 Main Street');
  const [areaVal, setAreaVal] = useState('Local code requires...');
  const [optVal, setOptVal] = useState<string | null>('Residential');
  const [multiVal, setMultiVal] = useState(['Gas heater', 'Heat pump']);

  return (
    <div style={{ background: '#1e1e1e', color: '#d4d4d4', minHeight: '100vh', fontFamily: 'var(--font-sans)', fontSize: '13px', padding: '40px', position: 'fixed', inset: 0, overflow: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>
          The Deep End UI Library
        </h1>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: 40 }}>
          All unique design components. Access at <code style={{ color: '#4a9eff' }}>#/ui-library</code>
        </p>

        {/* ── BRANDING ── */}
        <Section title="Branding">
          <Row>
            <Cell label="Mark (dark bg)">
              <BrandMark size={20} />
            </Cell>
            <Cell label="Mark (small)">
              <BrandMark size={14} />
            </Cell>
            <Cell label="Accent Color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#4a9eff' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#969696' }}>#4a9eff</span>
              </div>
            </Cell>
          </Row>
        </Section>

        {/* ── COLORS ── */}
        <Section title="Color Tokens">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[
              ['Base', '#1e1e1e'], ['Panel', '#252526'], ['Titlebar', '#2d2d2d'], ['Input', '#1a1a1a'],
              ['Hover', '#2a2d2e'], ['Active', '#37373d'], ['Selected', '#094771'],
              ['Border', '#3a3a3a'], ['Border Light', '#2d2d2d'],
              ['Accent', '#4a9eff'], ['Accent Hover', '#5aadff'], ['Accent Dim', '#264f78'],
              ['Success', '#4ec9b0'], ['Warning', '#ce9178'], ['Danger', '#f44747'],
            ].map(([name, color]) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 32, borderRadius: 4, background: color, border: '1px solid #3a3a3a' }} />
                <div style={{ fontSize: 9, color: '#969696', marginTop: 4 }}>{name}</div>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-sans)', color: '#666' }}>{color}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── TYPOGRAPHY ── */}
        <Section title="Typography">
          <Row>
            <Cell label="fs-xs (11px)"><span style={{ fontSize: 11, color: '#d4d4d4' }}>The quick brown fox</span></Cell>
            <Cell label="fs-sm (12px)"><span style={{ fontSize: 12, color: '#d4d4d4' }}>The quick brown fox</span></Cell>
            <Cell label="fs-base (13px)"><span style={{ fontSize: 13, color: '#d4d4d4' }}>The quick brown fox</span></Cell>
            <Cell label="fs-md (14px)"><span style={{ fontSize: 14, color: '#d4d4d4' }}>The quick brown fox</span></Cell>
          </Row>
          <Row>
            <Cell label="Mono"><span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#d4d4d4' }}>1,250 sq ft</span></Cell>
            <Cell label="Text Primary"><span style={{ color: '#d4d4d4' }}>Primary text</span></Cell>
            <Cell label="Text Secondary"><span style={{ color: '#969696' }}>Secondary text</span></Cell>
            <Cell label="Text Muted"><span style={{ color: '#666' }}>Muted text</span></Cell>
          </Row>
        </Section>

        {/* ── ICONS ── */}
        <Section title="Icons (Lucide)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[
              ['Save', Save], ['Lock', Lock], ['Unlock', Unlock], ['Share', Share2], ['Settings', Settings],
              ['PanelLeft', PanelLeftClose], ['PanelRight', PanelRightClose],
              ['ChevronR', ChevronRight], ['ChevronD', ChevronDown],
              ['Eye', Eye], ['EyeOff', EyeOff], ['Search', Search], ['Close', X],
              ['Plus', Plus], ['Minus', Minus],
              ['Select', MousePointer2], ['Pan', Hand], ['Ruler', Ruler], ['Pen', PenTool],
              ['Layers', Layers], ['Sliders', SlidersHorizontal], ['Grid', LayoutGrid],
              ['Grid3x3', Grid3x3], ['Magnet', Magnet], ['ZoomIn', ZoomIn], ['ZoomOut', ZoomOut],
              ['Grip', GripVertical], ['File', FileText], ['Calc', Calculator], ['Pkg', Package], ['Clock', Clock],
            ].map(([name, Icon]) => (
              <div key={name as string} style={{ width: 52, height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 4, border: '1px solid #2d2d2d' }}>
                <Icon size={16} color="#d4d4d4" />
                <span style={{ fontSize: 8, color: '#666' }}>{name as string}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── BUTTONS ── */}
        <Section title="Buttons">
          <Row>
            <Cell label="Primary">
              <button style={{ background: '#4a9eff', border: 'none', color: '#fff', fontSize: 12, padding: '5px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>Apply</button>
            </Cell>
            <Cell label="Secondary">
              <button style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', color: '#969696', fontSize: 12, padding: '5px 14px', borderRadius: 4, cursor: 'pointer' }}>Discard</button>
            </Cell>
            <Cell label="Icon Button">
              <button style={{ background: 'none', border: 'none', color: '#969696', padding: 5, borderRadius: 3, cursor: 'pointer', display: 'flex' }}><Save size={15} /></button>
            </Cell>
            <Cell label="Icon Active">
              <button style={{ background: 'none', border: 'none', color: '#4a9eff', padding: 5, borderRadius: 3, cursor: 'pointer', display: 'flex' }}><Lock size={15} /></button>
            </Cell>
            <Cell label="Add (dashed)">
              <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', background: 'none', border: '1px dashed #3a3a3a', borderRadius: 3, color: '#666', fontSize: 11, padding: '4px 8px', cursor: 'pointer' }}><Plus size={10} /> Add Point</button>
            </Cell>
          </Row>
        </Section>

        {/* ── FORM INPUTS ── */}
        <Section title="Form Inputs">
          <div style={{ maxWidth: 360 }}>
            <TextInput label="Text Input" value={textVal} onChange={setTextVal} placeholder="Enter value..." required />
            <TextArea label="Text Area" value={areaVal} onChange={setAreaVal} placeholder="Enter details..." rows={3} />
          </div>
        </Section>

        {/* ── OPTION BUTTONS ── */}
        <Section title="Option Button (Single Select)">
          <div style={{ maxWidth: 360 }}>
            <OptionButton
              label="Project Type"
              options={[
                { value: 'Residential', label: 'Residential' },
                { value: 'Private', label: 'Private' },
                { value: 'Semi-private', label: 'Semi-private' },
                { value: 'Public', label: 'Public' },
              ]}
              value={optVal}
              onChange={setOptVal}
            />
          </div>
        </Section>

        {/* ── MULTI SELECT ── */}
        <Section title="Multi Select">
          <div style={{ maxWidth: 360 }}>
            <MultiSelect
              label="Heating System"
              options={[
                { value: 'Gas heater', label: 'Gas heater' },
                { value: 'Heat pump', label: 'Heat pump' },
                { value: 'Solar', label: 'Solar' },
                { value: 'No heating', label: 'No heating' },
              ]}
              value={multiVal}
              onChange={setMultiVal}
            />
          </div>
        </Section>

        {/* ── PANEL HEADER ── */}
        <Section title="Panel Header">
          <div style={{ width: 260, border: '1px solid #3a3a3a', borderRadius: 4, overflow: 'hidden' }}>
            <PanelHeader title="Inspector" />
            <div style={{ padding: 12, fontSize: 12, color: '#666' }}>Panel content goes here</div>
          </div>
        </Section>

        {/* ── TREE NODE ── */}
        <Section title="Tree Nodes">
          <div style={{ width: 260, background: '#252526', border: '1px solid #3a3a3a', borderRadius: 4, padding: '4px 0' }}>
            {/* Config tree node */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '3px 10px 3px 24px', borderLeft: '2px solid transparent', cursor: 'pointer' }}>
              <span style={{ fontSize: 12, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ec9b0' }} />
                Project Type
              </span>
              <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)', marginTop: 1 }}>Residential</span>
            </div>
            {/* Active config tree node */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '3px 10px 3px 24px', borderLeft: '2px solid #4a9eff', background: '#094771', cursor: 'pointer' }}>
              <span style={{ fontSize: 12, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#666' }} />
                Gutter Style
              </span>
              <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)', marginTop: 1 }}>---</span>
            </div>
            {/* Object tree node */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', fontSize: 12, marginTop: 8 }}>
              <ChevronDown size={11} style={{ color: '#666' }} />
              <Eye size={10} style={{ color: '#666' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a9eff' }} />
              <span style={{ flex: 1, color: '#d4d4d4' }}>Pool Shell</span>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', color: '#666', background: '#1a1a1a', borderRadius: 3, padding: '0 4px' }}>4</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 34px', fontSize: 12 }}>
              <span style={{ width: 12 }} />
              <Eye size={10} style={{ color: '#666' }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64b5f6' }} />
              <span style={{ flex: 1, color: '#d4d4d4' }}>Steps</span>
              <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>24 sq ft</span>
            </div>
          </div>
        </Section>

        {/* ── COMPONENT ITEM ── */}
        <Section title="Component Library Item">
          <div style={{ width: 260, background: '#252526', border: '1px solid #3a3a3a', borderRadius: 4, padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', cursor: 'grab' }}>
              <GripVertical size={10} style={{ color: '#666' }} />
              <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, fontSize: 12, color: '#969696' }}>◎</span>
              <div>
                <div style={{ fontSize: 12, color: '#d4d4d4' }}>Wall Return</div>
                <div style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>1.5" eyeball</div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── TABS ── */}
        <Section title="Tabs">
          <Row>
            <Cell label="Authoring Mode Tabs">
              <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: 5, border: '1px solid #3a3a3a', overflow: 'hidden' }}>
                {['Geometry', 'Architecture', 'Fixtures', 'Hydraulics'].map((t, i) => (
                  <div key={t} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, color: i === 0 ? '#fff' : '#666', background: i === 0 ? '#4a9eff' : 'transparent', cursor: 'pointer' }}>{t}</div>
                ))}
              </div>
            </Cell>
          </Row>
          <Row>
            <Cell label="Workspace Tabs (bottom)">
              <div style={{ display: 'flex', background: '#252526', borderRadius: 4, border: '1px solid #3a3a3a', overflow: 'hidden', height: 32 }}>
                {['Design', 'Summary', 'Engineering', 'Estimate'].map((t, i) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', fontSize: 12, fontWeight: 500, color: i === 0 ? '#4a9eff' : '#666', borderBottom: i === 0 ? '2px solid #4a9eff' : '2px solid transparent', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }}>{t}</div>
                ))}
              </div>
            </Cell>
          </Row>
          <Row>
            <Cell label="Activity Bar Icons">
              <div style={{ display: 'flex', flexDirection: 'column', background: '#1b1b1b', borderRadius: 4, border: '1px solid #3a3a3a', width: 44, padding: '6px 0', alignItems: 'center', gap: 2 }}>
                {[{ Icon: Layers, active: true }, { Icon: SlidersHorizontal, active: false }, { Icon: LayoutGrid, active: false }].map(({ Icon, active }, i) => (
                  <div key={i} style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: active ? '2px solid #4a9eff' : '2px solid transparent', color: active ? '#f0f0f0' : '#666' }}>
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                ))}
              </div>
            </Cell>
          </Row>
        </Section>

        {/* ── POINT TABLE ── */}
        <Section title="Point Coordinate Table">
          <div style={{ width: 220 }}>
            <div style={{ border: '1px solid #3a3a3a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr', background: '#2d2d2d', padding: '3px 0', fontSize: 11, color: '#666', textAlign: 'center', fontWeight: 600 }}>
                <span>#</span><span>X</span><span>Y</span>
              </div>
              {[[0, 0], [380, 0], [400, 20], [520, 100]].map(([x, y], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr', borderTop: '1px solid #2d2d2d' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#666', fontFamily: 'var(--font-sans)' }}>{i}</span>
                  <input defaultValue={x} style={{ background: '#1a1a1a', border: 'none', borderLeft: '1px solid #2d2d2d', padding: '3px 6px', color: '#d4d4d4', fontFamily: 'var(--font-sans)', fontSize: 11, textAlign: 'center', outline: 'none', height: 24 }} />
                  <input defaultValue={y} style={{ background: '#1a1a1a', border: 'none', borderLeft: '1px solid #2d2d2d', padding: '3px 6px', color: '#d4d4d4', fontFamily: 'var(--font-sans)', fontSize: 11, textAlign: 'center', outline: 'none', height: 24 }} />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── SELECTION CARD ── */}
        <Section title="Selection Card (Inspector)">
          <div style={{ width: 220, background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 5, padding: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, borderRadius: 3, background: '#4a9eff', border: '1px solid #3a3a3a' }} />
              <span style={{ fontSize: 12, color: '#f0f0f0', fontWeight: 500 }}>Pool Shell</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666', marginTop: 3 }}>
              <span>Polygon, 9 pts</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#666' }} />
              <span>Geometry</span>
            </div>
          </div>
        </Section>

        {/* ── TRANSFORM GRID ── */}
        <Section title="Transform Inputs">
          <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[['X', '200', 'Y', '120'], ['W', '400', 'H', '200'], ['R', '0°', '', '']].map(([l1, v1, l2, v2], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '16px 1fr 16px 1fr', gap: 2, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#666', textAlign: 'center', fontWeight: 500 }}>{l1}</span>
                <input defaultValue={v1} style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, padding: '3px 6px', color: '#d4d4d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none', height: 24 }} />
                <span style={{ fontSize: 11, color: '#666', textAlign: 'center', fontWeight: 500 }}>{l2}</span>
                {v2 ? <input defaultValue={v2} style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, padding: '3px 6px', color: '#d4d4d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none', height: 24 }} /> : <span />}
              </div>
            ))}
          </div>
        </Section>

        {/* ── STATUS BAR ── */}
        <Section title="Status Bar Elements">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1b1b1b', border: '1px solid #3a3a3a', borderRadius: 4, padding: '4px 10px', height: 26 }}>
            <span style={{ fontSize: 11, color: '#4a9eff', fontWeight: 500 }}>Geometry</span>
            <span style={{ width: 1, height: 13, background: '#3a3a3a' }} />
            <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>select</span>
            <span style={{ width: 1, height: 13, background: '#3a3a3a' }} />
            <span style={{ fontSize: 11, color: '#4a9eff' }}>Grid</span>
            <span style={{ fontSize: 11, color: '#4a9eff' }}>Snap</span>
            <span style={{ fontSize: 11, color: '#4a9eff' }}>Dims</span>
            <span style={{ width: 1, height: 13, background: '#3a3a3a' }} />
            <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>x: 0 y: 0</span>
            <span style={{ width: 1, height: 13, background: '#3a3a3a' }} />
            <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>0/17 config</span>
            <span style={{ fontSize: 11, color: '#969696', fontFamily: 'var(--font-sans)' }}>100%</span>
          </div>
        </Section>

        {/* ── MENU DROPDOWN ── */}
        <Section title="Menu Dropdown">
          <div style={{ width: 220, background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: 5, padding: '2px 0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
            {[
              { label: 'Undo', shortcut: '\u2318Z' },
              { label: 'Redo', shortcut: '\u21E7\u2318Z' },
              { divider: true },
              { label: 'Cut', shortcut: '\u2318X', hover: true },
              { label: 'Copy', shortcut: '\u2318C' },
              { label: 'Paste', shortcut: '\u2318V' },
            ].map((item, i) =>
              'divider' in item && !('label' in item) ? (
                <div key={i} style={{ height: 1, background: '#3a3a3a', margin: '2px 0' }} />
              ) : (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: 12, color: 'hover' in item ? '#fff' : '#d4d4d4', background: 'hover' in item ? '#4a9eff' : 'transparent', cursor: 'pointer', minHeight: 26, alignItems: 'center' }}>
                  <span>{'label' in item ? item.label : ''}</span>
                  <span style={{ fontSize: 11, color: 'hover' in item ? 'rgba(255,255,255,0.7)' : '#666' }}>{'shortcut' in item ? item.shortcut : ''}</span>
                </div>
              )
            )}
          </div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 6 }}>* "Cut" row shown in hover state</div>
        </Section>

        {/* ══════════════════════════════════════════ */}
        {/* ── INTERACTIVE STATES ── */}
        {/* ══════════════════════════════════════════ */}

        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', marginTop: 48, marginBottom: 24, paddingTop: 24, borderTop: '1px solid #3a3a3a' }}>
          Interactive States
        </h2>

        {/* ── BUTTONS: all states ── */}
        <Section title="Button States">
          <Row>
            <Cell label="Primary - Default">
              <button style={{ background: '#4a9eff', border: 'none', color: '#fff', fontSize: 12, padding: '5px 14px', borderRadius: 4, fontWeight: 500 }}>Apply</button>
            </Cell>
            <Cell label="Primary - Hover">
              <button style={{ background: '#5aadff', border: 'none', color: '#fff', fontSize: 12, padding: '5px 14px', borderRadius: 4, fontWeight: 500 }}>Apply</button>
            </Cell>
            <Cell label="Primary - Active">
              <button style={{ background: '#3d8ee6', border: 'none', color: '#fff', fontSize: 12, padding: '5px 14px', borderRadius: 4, fontWeight: 500 }}>Apply</button>
            </Cell>
            <Cell label="Primary - Disabled">
              <button style={{ background: '#4a9eff', border: 'none', color: '#fff', fontSize: 12, padding: '5px 14px', borderRadius: 4, fontWeight: 500, opacity: 0.4 }}>Apply</button>
            </Cell>
          </Row>
          <Row>
            <Cell label="Secondary - Default">
              <button style={{ background: '#1a1a1a', border: '1px solid #3a3a3a', color: '#969696', fontSize: 12, padding: '5px 14px', borderRadius: 4 }}>Discard</button>
            </Cell>
            <Cell label="Secondary - Hover">
              <button style={{ background: '#2a2d2e', border: '1px solid #3a3a3a', color: '#d4d4d4', fontSize: 12, padding: '5px 14px', borderRadius: 4 }}>Discard</button>
            </Cell>
            <Cell label="Dashed - Default">
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px dashed #3a3a3a', borderRadius: 3, color: '#666', fontSize: 11, padding: '4px 12px' }}><Plus size={10} /> Add Point</button>
            </Cell>
            <Cell label="Dashed - Hover">
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px dashed #4a9eff', borderRadius: 3, color: '#4a9eff', fontSize: 11, padding: '4px 12px' }}><Plus size={10} /> Add Point</button>
            </Cell>
          </Row>
        </Section>

        {/* ── ICON BUTTONS: all states ── */}
        <Section title="Icon Button States">
          <Row>
            <Cell label="Default">
              <div style={{ background: 'none', padding: 6, borderRadius: 3, display: 'inline-flex', color: '#969696' }}><Save size={15} /></div>
            </Cell>
            <Cell label="Hover">
              <div style={{ background: '#2a2d2e', padding: 6, borderRadius: 3, display: 'inline-flex', color: '#d4d4d4' }}><Save size={15} /></div>
            </Cell>
            <Cell label="Active (toggled)">
              <div style={{ background: 'none', padding: 6, borderRadius: 3, display: 'inline-flex', color: '#4a9eff' }}><Lock size={15} /></div>
            </Cell>
            <Cell label="Active + Hover">
              <div style={{ background: '#2a2d2e', padding: 6, borderRadius: 3, display: 'inline-flex', color: '#4a9eff' }}><Lock size={15} /></div>
            </Cell>
          </Row>
        </Section>

        {/* ── TOOL STRIP ITEMS: all states ── */}
        <Section title="Tool Strip States">
          <Row>
            <Cell label="Default">
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', borderRadius: 3, color: '#969696' }}>
                <MousePointer2 size={17} strokeWidth={1.5} />
              </div>
            </Cell>
            <Cell label="Hover">
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2d2e', borderRadius: 3, color: '#d4d4d4' }}>
                <Hand size={17} strokeWidth={1.5} />
              </div>
            </Cell>
            <Cell label="Active">
              <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#264f78', borderRadius: 3, color: '#4a9eff' }}>
                <MousePointer2 size={17} strokeWidth={1.5} />
              </div>
            </Cell>
          </Row>
        </Section>

        {/* ── ACTIVITY BAR ITEMS: all states ── */}
        <Section title="Activity Bar Icon States">
          <Row>
            <Cell label="Default">
              <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '2px solid transparent', color: '#666' }}>
                <Layers size={20} strokeWidth={1.5} />
              </div>
            </Cell>
            <Cell label="Hover">
              <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '2px solid transparent', color: '#d4d4d4' }}>
                <Layers size={20} strokeWidth={1.5} />
              </div>
            </Cell>
            <Cell label="Active">
              <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '2px solid #4a9eff', color: '#f0f0f0' }}>
                <Layers size={20} strokeWidth={1.5} />
              </div>
            </Cell>
          </Row>
        </Section>

        {/* ── AUTHORING TAB STATES ── */}
        <Section title="Authoring Mode Tab States">
          <Row>
            <Cell label="Default">
              <div style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, color: '#666', background: 'transparent', border: '1px solid #3a3a3a', borderRadius: 4 }}>Fixtures</div>
            </Cell>
            <Cell label="Hover">
              <div style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, color: '#d4d4d4', background: '#2a2d2e', border: '1px solid #3a3a3a', borderRadius: 4 }}>Fixtures</div>
            </Cell>
            <Cell label="Active">
              <div style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, color: '#fff', background: '#4a9eff', border: '1px solid #4a9eff', borderRadius: 4 }}>Geometry</div>
            </Cell>
          </Row>
        </Section>

        {/* ── WORKSPACE TAB STATES ── */}
        <Section title="Workspace Tab States">
          <Row>
            <Cell label="Default">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', fontSize: 12, fontWeight: 500, color: '#666', borderBottom: '2px solid transparent', height: 32, boxSizing: 'border-box' }}>
                <Calculator size={13} /> Engineering
              </div>
            </Cell>
            <Cell label="Hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', fontSize: 12, fontWeight: 500, color: '#d4d4d4', borderBottom: '2px solid transparent', height: 32, boxSizing: 'border-box' }}>
                <Calculator size={13} /> Engineering
              </div>
            </Cell>
            <Cell label="Active">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', fontSize: 12, fontWeight: 500, color: '#4a9eff', borderBottom: '2px solid #4a9eff', height: 32, boxSizing: 'border-box' }}>
                <PenTool size={13} /> Design
              </div>
            </Cell>
          </Row>
        </Section>

        {/* ── TREE NODE STATES ── */}
        <Section title="Tree Node States">
          <div style={{ width: 260, background: '#252526', border: '1px solid #3a3a3a', borderRadius: 4, padding: '4px 0' }}>
            {/* Default */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '3px 10px 3px 24px', borderLeft: '2px solid transparent' }}>
              <span style={{ fontSize: 10, color: '#666', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Default</span>
              <span style={{ fontSize: 12, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ec9b0' }} />
                Project Type
              </span>
              <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)', marginTop: 1 }}>Residential</span>
            </div>
            {/* Hover */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '3px 10px 3px 24px', borderLeft: '2px solid transparent', background: '#2a2d2e' }}>
              <span style={{ fontSize: 10, color: '#666', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hover</span>
              <span style={{ fontSize: 12, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ec9b0' }} />
                Gutter Style
              </span>
              <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)', marginTop: 1 }}>Skimmer</span>
            </div>
            {/* Active / Selected */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '3px 10px 3px 24px', borderLeft: '2px solid #4a9eff', background: '#094771' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active</span>
              <span style={{ fontSize: 12, color: '#d4d4d4', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#666' }} />
                Coping Style
              </span>
              <span style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)', marginTop: 1 }}>---</span>
            </div>
          </div>
        </Section>

        {/* ── OBJECT TREE ROW STATES ── */}
        <Section title="Procurement Row States">
          <div style={{ width: 260, background: '#252526', border: '1px solid #3a3a3a', borderRadius: 4, padding: '4px 0' }}>
            {/* Default */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', fontSize: 12 }}>
              <ChevronDown size={11} style={{ color: '#666' }} />
              <Eye size={10} style={{ color: '#666', opacity: 0.5 }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4a9eff' }} />
              <span style={{ flex: 1, color: '#d4d4d4' }}>Pool Shell</span>
              <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>default</span>
            </div>
            {/* Hover - eye becomes visible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', fontSize: 12, background: '#2a2d2e' }}>
              <ChevronDown size={11} style={{ color: '#666' }} />
              <Eye size={10} style={{ color: '#666', opacity: 1 }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ec9b0' }} />
              <span style={{ flex: 1, color: '#d4d4d4' }}>Fixtures</span>
              <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>hover</span>
            </div>
            {/* Hidden */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', fontSize: 12 }}>
              <span style={{ width: 11 }} />
              <EyeOff size={10} style={{ color: '#666', opacity: 0.5 }} />
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dcdcaa' }} />
              <span style={{ flex: 1, color: '#d4d4d4', opacity: 0.35 }}>Electrical</span>
              <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>hidden</span>
            </div>
          </div>
        </Section>

        {/* ── INPUT STATES ── */}
        <Section title="Input Field States">
          <Row>
            <Cell label="Default">
              <input readOnly value="200" style={{ width: 80, background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, padding: '3px 6px', color: '#d4d4d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none', height: 24 }} />
            </Cell>
            <Cell label="Focused">
              <input readOnly value="200" style={{ width: 80, background: '#1a1a1a', border: '1px solid #4a9eff', borderRadius: 3, padding: '3px 6px', color: '#d4d4d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none', height: 24 }} />
            </Cell>
            <Cell label="Active (editing)">
              <input readOnly value="200" style={{ width: 80, background: '#37373d', border: '1px solid #4a9eff', borderRadius: 3, padding: '3px 6px', color: '#f0f0f0', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none', height: 24 }} />
            </Cell>
            <Cell label="Disabled">
              <input readOnly value="200" style={{ width: 80, background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, padding: '3px 6px', color: '#d4d4d4', fontFamily: 'var(--font-sans)', fontSize: 11, outline: 'none', height: 24, opacity: 0.4 }} />
            </Cell>
          </Row>
        </Section>

        {/* ── OPTION BUTTON STATES ── */}
        <Section title="Option Button States">
          <div style={{ maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Default */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, padding: '4px 6px', fontSize: 12, color: '#d4d4d4' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #666', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              Default option
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#666', textTransform: 'uppercase' }}>default</span>
            </div>
            {/* Hover */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2a2d2e', border: '1px solid #3a3a3a', borderRadius: 3, padding: '4px 6px', fontSize: 12, color: '#d4d4d4' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #666', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              Hovered option
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#666', textTransform: 'uppercase' }}>hover</span>
            </div>
            {/* Selected */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#094771', border: '1px solid #4a9eff', borderRadius: 3, padding: '4px 6px', fontSize: 12, color: '#f0f0f0' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid #4a9eff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a9eff' }} />
              </span>
              Selected option
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>active</span>
            </div>
          </div>
        </Section>

        {/* ── MENU ITEM STATES ── */}
        <Section title="Menu Item States">
          <div style={{ width: 220, background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: 5, padding: '2px 0' }}>
            {/* Default */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: 12, color: '#d4d4d4', minHeight: 26, alignItems: 'center' }}>
              <span>Undo</span>
              <span style={{ fontSize: 11, color: '#666' }}>{'\u2318Z'}</span>
            </div>
            {/* Hover */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: 12, color: '#fff', background: '#4a9eff', minHeight: 26, alignItems: 'center' }}>
              <span>Redo</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{'\u21E7\u2318Z'}</span>
            </div>
            {/* Disabled */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: 12, color: '#d4d4d4', minHeight: 26, alignItems: 'center', opacity: 0.35 }}>
              <span>Paste</span>
              <span style={{ fontSize: 11, color: '#666' }}>{'\u2318V'}</span>
            </div>
          </div>
        </Section>

        {/* ── STATUS BAR TOGGLE STATES ── */}
        <Section title="Status Bar Toggle States">
          <Row>
            <Cell label="Off">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 5px', borderRadius: 3, fontSize: 11, color: '#666' }}>
                <Grid3x3 size={11} /> Grid
              </div>
            </Cell>
            <Cell label="Off + Hover">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 5px', borderRadius: 3, fontSize: 11, color: '#d4d4d4', background: '#2a2d2e' }}>
                <Grid3x3 size={11} /> Grid
              </div>
            </Cell>
            <Cell label="On">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 5px', borderRadius: 3, fontSize: 11, color: '#4a9eff' }}>
                <Grid3x3 size={11} /> Grid
              </div>
            </Cell>
            <Cell label="On + Hover">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 5px', borderRadius: 3, fontSize: 11, color: '#4a9eff', background: '#2a2d2e' }}>
                <Grid3x3 size={11} /> Grid
              </div>
            </Cell>
          </Row>
        </Section>

        {/* ── COMPONENT LIBRARY ITEM STATES ── */}
        <Section title="Component Library Item States">
          <div style={{ width: 260, background: '#252526', border: '1px solid #3a3a3a', borderRadius: 4, padding: '4px 0' }}>
            {/* Default */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px' }}>
              <GripVertical size={10} style={{ color: '#666', opacity: 0 }} />
              <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, fontSize: 12, color: '#969696' }}>◎</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#d4d4d4' }}>Wall Return</div>
                <div style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>1.5" eyeball</div>
              </div>
              <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>default</span>
            </div>
            {/* Hover - grip visible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#2a2d2e' }}>
              <GripVertical size={10} style={{ color: '#666', opacity: 0.6 }} />
              <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, fontSize: 12, color: '#969696' }}>▣</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#d4d4d4' }}>Main Drain</div>
                <div style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>12x12 VGB</div>
              </div>
              <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>hover</span>
            </div>
            {/* Dragging */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#37373d', cursor: 'grabbing' }}>
              <GripVertical size={10} style={{ color: '#969696', opacity: 1 }} />
              <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 3, fontSize: 12, color: '#969696' }}>◇</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#d4d4d4' }}>Wall Light</div>
                <div style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-sans)' }}>LED color</div>
              </div>
              <span style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>drag</span>
            </div>
          </div>
        </Section>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

// ── Layout helpers ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #2d2d2d' }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 16 }}>{children}</div>;
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      {children}
    </div>
  );
}
