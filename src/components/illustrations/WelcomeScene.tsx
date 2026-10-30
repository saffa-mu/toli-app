const SKINS = ['#E8B98F', '#A86B45', '#F6D7B8', '#C98E62'];
const SHIRTS = ['#0F766E', '#F59E0B', '#5EAAA0', '#334155'];
const HAIR = '#2B2118';

function Friend({ x, i }: { x: number; i: number }) {
  const skin = SKINS[i];
  const shirt = SHIRTS[i];
  const holdsChai = i !== 2;
  return (
    <g>
      {/* legs */}
      <path d={`M${x - 11} 150h10v38h-10z M${x + 1} 150h10v38h-10z`} fill="#334155" />
      <path d={`M${x - 14} 188h14v6h-14z M${x} 188h14v6h-14z`} fill="#1F2933" />
      {/* torso */}
      <rect x={x - 17} y={108} width={34} height={46} rx={14} fill={shirt} />
      {/* head */}
      <rect x={x - 4} y={98} width={8} height={10} fill={skin} />
      <circle cx={x} cy={90} r={13} fill={skin} />
      {i === 0 && (
        <path d={`M${x - 13} 88c0-10 6-15 13-15s13 5 13 15c-3-5-7-7-13-7s-10 2-13 7z`} fill={HAIR} />
      )}
      {i === 1 && (
        <>
          <circle cx={x} cy={73} r={6} fill={HAIR} />
          <path d={`M${x - 13} 89c0-10 6-15 13-15s13 5 13 15c-3-6-8-8-13-8s-10 2-13 8z`} fill={HAIR} />
        </>
      )}
      {i === 2 && (
        <g fill={HAIR}>
          {[-9, -3, 3, 9].map((d) => (
            <circle key={d} cx={x + d} cy={78 + Math.abs(d) / 3} r={5} />
          ))}
        </g>
      )}
      {i === 3 && <path d={`M${x - 14} 92c-1-12 6-19 14-19s15 7 14 19l1 22h-30z`} fill={HAIR} />}
      {i === 3 && <circle cx={x} cy={91} r={12} fill={skin} />}
      {i === 3 && <path d={`M${x - 12} 86c1-6 5-9 12-9s11 3 12 9c-4-3-7-4-12-4s-8 1-12 4z`} fill={HAIR} />}
      <circle cx={x - 4} cy={91} r={1.4} fill="#1F2933" />
      <circle cx={x + 4} cy={91} r={1.4} fill="#1F2933" />
      <path
        d={`M${x - 3} 96c2 1.6 4 1.6 6 0`}
        stroke="#7A4A2E"
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      {/* arm + cutting chai */}
      {holdsChai ? (
        <g>
          <path
            d={`M${x + 12} 118c6 6 6 14 0 18`}
            stroke={shirt}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={x + 9} cy={136} r={4} fill={skin} />
          <path d={`M${x + 5} 124h10l-1.6 12h-6.8z`} fill="#FFFFFF" opacity={0.85} />
          <path d={`M${x + 5.6} 128h8.8l-1.1 8h-6.6z`} fill="#C2802A" />
        </g>
      ) : (
        <path
          d={`M${x - 12} 118c-8 4-10 12-6 18`}
          stroke={shirt}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/** Four friends on a bench beside a badminton court, with cutting chai and rackets. */
export function WelcomeScene() {
  return (
    <svg
      viewBox="0 0 360 230"
      className="h-auto w-full"
      role="img"
      aria-label="Four friends on a bench beside a badminton court, holding cutting chai"
    >
      <rect x="0" y="0" width="360" height="230" rx="24" fill="#EFF8F6" />
      {/* sun and trees */}
      <circle cx="300" cy="40" r="16" fill="#FDE9BF" />
      <circle cx="40" cy="70" r="26" fill="#A9DCD4" />
      <rect x="37" y="80" width="6" height="40" fill="#5EAAA0" />
      {/* ground */}
      <path d="M0 176h360v30a24 24 0 0 1-24 24H24A24 24 0 0 1 0 206z" fill="#D5EEEA" />
      {/* court */}
      <path d="M232 112h112l14 82H220z" fill="#5EAAA0" />
      <path d="M236 116h104l12 74H226z" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M288 116v74M231 152h116" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M226 140h126" stroke="#1F2933" strokeWidth="1" />
      <path d="M226 132h126v8H226z" fill="#FFFFFF" opacity="0.5" />
      <path d="M226 128v28M352 128v28" stroke="#1F2933" strokeWidth="2.5" strokeLinecap="round" />
      {/* bench back */}
      <rect x="14" y="112" width="196" height="9" rx="4" fill="#A16207" />
      {/* friends */}
      {[46, 92, 138, 184].map((x, i) => (
        <Friend key={x} x={x} i={i} />
      ))}
      {/* bench seat and legs */}
      <rect x="10" y="148" width="204" height="10" rx="4" fill="#B7791F" />
      <path d="M22 158h7v36h-7zM196 158h7v36h-7z" fill="#7C4A12" />
      {/* rackets leaning on the bench */}
      <g transform="rotate(-18 214 150)">
        <ellipse cx="214" cy="120" rx="10" ry="14" fill="none" stroke="#1F2933" strokeWidth="2.5" />
        <path
          d="M206 120h16M214 107v26M209 112l10 16M219 112l-10 16"
          stroke="#1F2933"
          strokeWidth="0.8"
          opacity="0.6"
        />
        <path d="M214 134v34" stroke="#1F2933" strokeWidth="3" strokeLinecap="round" />
        <path d="M214 156v12" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* shuttlecock */}
      <g transform="translate(250 200) rotate(-25)">
        <path d="M0 0l-6-12h12z" fill="#FFFFFF" stroke="#1F2933" strokeWidth="1" />
        <circle cx="0" cy="1" r="3" fill="#1F2933" />
      </g>
    </svg>
  );
}
