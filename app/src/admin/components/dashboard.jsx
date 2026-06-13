import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ApiClient } from 'adminjs'

const T = {
  bg:      '#080808',
  surface: '#101010',
  card:    '#161616',
  elevated:'#1e1e1e',
  border:  'rgba(255,255,255,0.07)',
  borderH: 'rgba(255,255,255,0.13)',
  text:    '#ebebeb',
  muted:   '#888888',
  dim:     '#555555',
  accent:  '#a259ff',
  adim:    'rgba(162,89,255,0.12)',
  green:   '#3ecf8e',
  gdim:    'rgba(62,207,142,0.12)',
  blue:    '#5b8af5',
  bdim:    'rgba(91,138,245,0.12)',
  ease:    'cubic-bezier(0.16,1,0.3,1)',
  font:    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

const Page = styled.div`
  font-family: ${T.font};
  color: ${T.text};
  -webkit-font-smoothing: antialiased;
`

const Hero = styled.section`
  padding: 56px 0 48px;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 500px;
    background: radial-gradient(circle, rgba(162,89,255,0.10) 0%, transparent 70%);
    pointer-events: none;
  }
`

const Eyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${T.accent};
  margin: 0 0 16px;
  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${T.accent};
    animation: pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
`

const HeroTitle = styled.h1`
  font-size: clamp(1.8rem, 3vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.08;
  margin: 0 0 14px;
  color: ${T.text};
  span { color: ${T.dim}; }
`

const HeroSub = styled.p`
  font-size: 1rem;
  color: ${T.muted};
  line-height: 1.6;
  margin: 0;
  max-width: 520px;
`

const StatsStrip = styled.div`
  border-top: 1px solid ${T.border};
  border-bottom: 1px solid ${T.border};
  padding: 24px 0;
  margin: 40px 0 56px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`

const Stat = styled.div`
  padding: 0 28px;
  border-right: 1px solid ${T.border};
  &:first-child { padding-left: 0; }
  &:last-child { border-right: none; }
  @media (max-width: 900px) {
    padding: 10px 0;
    border-right: none;
    border-bottom: 1px solid ${T.border};
    &:nth-child(3), &:last-child { border-bottom: none; }
  }
`

const StatValue = styled.div`
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: ${T.text};
`

const StatLabel = styled.div`
  font-size: 12.5px;
  color: ${T.muted};
  margin-top: 2px;
`

const CardsSection = styled.div`
  margin-bottom: 20px;
`

const SectionHeader = styled.div`margin-bottom: 28px;`

const SectionTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${T.dim};
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-bottom: 10px;
  &::before {
    content: '';
    display: block;
    width: 16px; height: 1px;
    background: ${T.borderH};
  }
`

const SectionTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: ${T.text};
  margin: 0;
`

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
`

const Card = styled.div`
  background: ${T.card};
  border: 1px solid ${T.border};
  border-radius: 14px;
  padding: 22px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 200ms ${T.ease},
              background 200ms ${T.ease},
              transform 200ms ${T.ease},
              box-shadow 200ms ${T.ease};
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 200ms ${T.ease};
    background: radial-gradient(500px circle at var(--mx,50%) var(--my,50%), rgba(162,89,255,0.05), transparent 40%);
  }
  &:hover {
    border-color: ${T.borderH};
    background: ${T.elevated};
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  }
  &:hover::after { opacity: 1; }
`

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
`

const CardIcon = styled.div`
  width: 38px; height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  svg { width: 17px; height: 17px; }
  &.purple { background: ${T.adim};  color: ${T.accent}; }
  &.green  { background: ${T.gdim};  color: ${T.green}; }
  &.blue   { background: ${T.bdim};  color: ${T.blue}; }
  &.muted  { background: ${T.elevated}; color: ${T.muted}; }
`

const Tag = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
  &.stable { background: ${T.gdim}; color: ${T.green}; border: 1px solid rgba(62,207,142,0.2); }
  &.new    { background: ${T.adim}; color: ${T.accent}; border: 1px solid rgba(162,89,255,0.2); }
  &.def    { background: ${T.elevated}; color: ${T.muted}; border: 1px solid ${T.border}; }
`

const CardTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${T.text};
  margin-bottom: 5px;
  letter-spacing: -0.2px;
`

const CardDesc = styled.div`
  font-size: 13px;
  color: ${T.muted};
  line-height: 1.55;
  margin-bottom: 18px;
`

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid ${T.border};
`

const CardCount = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${T.text};
  letter-spacing: -0.5px;
`

const CardCountLabel = styled.div`
  font-size: 11px;
  color: ${T.dim};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const CardAction = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${T.dim};
  transition: color 150ms ${T.ease};
  ${Card}:hover & { color: ${T.accent}; }
  svg { width: 14px; height: 14px; }
`

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const Dashboard = () => {
  const [stats, setStats] = useState({ ventas: 0, bebidas: 0, barras: 0, detalles: 0, loading: true })

  useEffect(() => {
    const api = new ApiClient()
    Promise.all([
      api.resourceAction({ resourceId: 'Venta',        actionName: 'list' }),
      api.resourceAction({ resourceId: 'Bebida',       actionName: 'list' }),
      api.resourceAction({ resourceId: 'Barra',        actionName: 'list' }),
      api.resourceAction({ resourceId: 'DetalleVenta', actionName: 'list' }),
    ]).then(([v, b, ba, d]) => {
      setStats({
        ventas:   v.data.meta.total  || 0,
        bebidas:  b.data.meta.total  || 0,
        barras:   ba.data.meta.total || 0,
        detalles: d.data.meta.total  || 0,
        loading: false,
      })
    }).catch(() => setStats(s => ({ ...s, loading: false })))
  }, [])

  const go = (id) => { window.location.href = `/admin/resources/${id}` }
  const n  = (v)  => stats.loading ? '—' : v

  const spotlight = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  const resources = [
    {
      id: 'Bebida', name: 'Bebidas', tag: 'stable', tagLabel: 'Maestros', icon: 'purple',
      desc: 'Menú con nombre, precio y descripción de cada trago.',
      count: stats.bebidas,
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14l-7 9z"/><line x1="12" y1="12" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/></svg>,
    },
    {
      id: 'Barra', name: 'Barras', tag: 'stable', tagLabel: 'Maestros', icon: 'blue',
      desc: 'Puntos de venta del local con número y sector.',
      count: stats.barras,
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h18M3 10l2-5h14l2 5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>,
    },
    {
      id: 'Venta', name: 'Ventas', tag: 'new', tagLabel: 'Nuevo', icon: 'green',
      desc: 'Comprobantes con número, fecha, hora y total.',
      count: stats.ventas,
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      id: 'DetalleVenta', name: 'Detalle de Ventas', tag: 'def', tagLabel: 'Ventas', icon: 'muted',
      desc: 'Líneas que vinculan venta, bebida y barra con su subtotal.',
      count: stats.detalles,
      svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
  ]

  return (
    <Page>
      <Hero>
        <Eyebrow>Grupo 7 · Express + Docker</Eyebrow>
        <HeroTitle>
          Bar — Panel de control<br/>
          <span>de la barra a la caja.</span>
        </HeroTitle>
        <HeroSub>
          Administrá las barras, el menú de bebidas y el registro de ventas desde este panel.
        </HeroSub>
      </Hero>

      <StatsStrip>
        <StatsGrid>
          <Stat><StatValue>{n(stats.ventas)}</StatValue><StatLabel>Ventas registradas</StatLabel></Stat>
          <Stat><StatValue>{n(stats.bebidas)}</StatValue><StatLabel>Bebidas en menú</StatLabel></Stat>
          <Stat><StatValue>{n(stats.barras)}</StatValue><StatLabel>Barras activas</StatLabel></Stat>
          <Stat><StatValue>{n(stats.detalles)}</StatValue><StatLabel>Líneas de detalle</StatLabel></Stat>
        </StatsGrid>
      </StatsStrip>

      <CardsSection>
        <SectionHeader>
          <SectionTag>Módulos</SectionTag>
          <SectionTitle>Todo el bar, cubierto.</SectionTitle>
        </SectionHeader>
        <CardsGrid>
          {resources.map((r) => (
            <Card key={r.id} onClick={() => go(r.id)} onMouseMove={spotlight}>
              <CardHeader>
                <CardIcon className={r.icon}>{r.svg}</CardIcon>
                <Tag className={r.tag}>{r.tagLabel}</Tag>
              </CardHeader>
              <CardTitle>{r.name}</CardTitle>
              <CardDesc>{r.desc}</CardDesc>
              <CardMeta>
                <div>
                  <CardCount>{n(r.count)}</CardCount>
                  <CardCountLabel>registros</CardCountLabel>
                </div>
                <CardAction>
                  Ver <Chevron />
                </CardAction>
              </CardMeta>
            </Card>
          ))}
        </CardsGrid>
      </CardsSection>
    </Page>
  )
}

export default Dashboard
