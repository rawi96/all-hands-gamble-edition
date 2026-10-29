import { getAvatar } from "@/lib/avatars";

// Small, original vector puppets: crisp at phone and projector sizes, no image requests.
export function AvatarArt({ id }: { id?: string }) {
  const a = getAvatar(id);
  const k: string = a.kind;
  const d: string = a.detail;
  const ink = "#192650";
  const bodies: Record<string, string> = {
    ears: "M22 45 19 17 40 31Q50 27 60 31L81 17 78 45Q92 85 50 89 8 85 22 45Z",
    bean: "M34 20Q65 9 74 41L80 69Q83 92 51 91 19 92 21 70L23 45Q23 26 34 20Z",
    blob: "M22 38Q12 20 36 24 51 9 64 27 90 21 80 45 99 60 80 73 80 96 56 86 30 100 24 79 3 66 22 38Z",
    ghost: "M20 81V46Q20 18 50 18T80 46V86L66 77 55 88 43 77 31 88Z",
    flame:
      "M22 47 31 23 43 34 55 12 65 34 79 28 83 62Q85 90 51 90 16 89 22 47Z",
    box: "M20 35Q20 27 28 27H72Q80 27 80 35V78Q80 87 72 87H28Q20 87 20 78Z",
    toast: "M24 45Q9 26 28 20 50 9 73 21 91 29 77 45V83H24Z",
    mushroom: "M31 49H69L75 83Q51 96 25 83Z",
    cloud:
      "M24 40Q11 22 34 24 45 5 62 22 89 14 84 41 99 59 79 75 76 93 51 87 25 95 22 75 1 62 24 40Z",
    jelly:
      "M20 60Q14 20 50 19 88 20 80 60L87 81 72 77 64 89 50 80 37 90 27 77 14 83Z",
    lemon:
      "M15 55Q19 24 53 25L76 20 80 41Q92 70 63 85L38 88 29 77Q14 73 15 55Z",
    cactus:
      "M33 77V35Q33 18 49 18T65 35V44Q65 50 71 47V35H82V52Q82 65 65 65V88H33V66Q15 66 15 52V42H26V54Q33 58 33 51Z",
    bat: "M24 43 7 31 11 62 23 67Q18 90 50 90T77 67L89 61 93 31 76 43 68 20 55 32H43L31 20Z",
    crab: "M23 48 10 34 9 19 20 25 26 17 28 35 34 43Q50 32 66 43L74 34 73 18 83 25 92 18 90 36 78 49Q92 82 50 88 8 82 23 48Z",
    antenna: "M21 47Q19 25 50 25T79 47L81 68Q80 89 50 89T19 68Z",
    fin: "M23 48 37 31 54 12 61 33Q83 40 82 65T50 90Q18 89 18 67Z",
    frog: "M21 46Q10 19 31 20 45 18 45 36H55Q55 18 69 20 90 19 79 46Q88 86 50 90 12 86 21 46Z",
    round: "M17 57A33 33 0 1 0 83 57 33 33 0 1 0 17 57Z",
  };
  return (
    <svg
      className="avatar-art"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="91" rx="28" ry="4" fill={ink} opacity=".13" />
      {k === "antenna" && (
        <g stroke={ink} strokeWidth="3">
          <path d="M34 29 29 14M66 29 72 14" />
          <circle cx="28" cy="12" r="5" fill="#FFE18A" />
          <circle cx="73" cy="12" r="5" fill="#FF784F" />
        </g>
      )}
      <path
        d={bodies[k] || bodies.round}
        fill={a.color}
        stroke={ink}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {k === "mushroom" && (
        <path
          d="M10 46Q14 12 50 12T90 46Q49 60 10 46Z"
          fill="#FF784F"
          stroke={ink}
          strokeWidth="2.6"
        />
      )}
      {d === "dots" && (
        <g fill="#FFF8ED">
          <circle cx="30" cy="32" r="6" />
          <circle cx="55" cy="23" r="5" />
          <circle cx="71" cy="37" r="7" />
        </g>
      )}
      {d === "yolk" && (
        <ellipse cx="50" cy="61" rx="23" ry="24" fill="#FFCB53" />
      )}
      {d === "mask" && (
        <g fill={ink} opacity=".6">
          <ellipse
            cx="35"
            cy="52"
            rx="13"
            ry="15"
            transform="rotate(-15 35 52)"
          />
          <ellipse
            cx="65"
            cy="52"
            rx="13"
            ry="15"
            transform="rotate(15 65 52)"
          />
        </g>
      )}
      <g className="puppet-eyes">
        {d === "cyclops" ? (
          <>
            <circle cx="50" cy="49" r="17" fill="white" />
            <circle cx="52" cy="50" r="8" fill={ink} />
            <circle cx="55" cy="46" r="3" fill="white" />
          </>
        ) : (
          <>
            {[36, 64].map((x) => (
              <g key={x}>
                <ellipse
                  cx={x}
                  cy="52"
                  rx="10"
                  ry={k === "mushroom" ? 9 : 13}
                  fill="white"
                />
                <ellipse cx={x + 1} cy="53" rx="4.5" ry="6.5" fill={ink} />
                <circle cx={x + 3} cy="50" r="1.8" fill="white" />
              </g>
            ))}
            {d === "third" && (
              <>
                <ellipse cx="50" cy="30" rx="8" ry="10" fill="white" />
                <circle cx="50" cy="31" r="4" fill={ink} />
              </>
            )}
          </>
        )}
      </g>
      <g fill="#EC7294" opacity=".65">
        <ellipse cx="26" cy="67" rx="6" ry="3" />
        <ellipse cx="74" cy="67" rx="6" ry="3" />
      </g>
      {a.mood === "wow" ? (
        <ellipse cx="50" cy="74" rx="6" ry="8" fill={ink} />
      ) : a.mood === "flat" ? (
        <path
          d="M43 73H57"
          stroke={ink}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ) : a.mood === "grin" ? (
        <>
          <path d="M36 69Q50 94 65 69Z" fill={ink} />
          <path d="M39 70H62L59 76H43Z" fill="white" />
        </>
      ) : (
        <path
          d="M40 71Q50 81 61 71"
          stroke={ink}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {d === "teeth" && (
        <path
          d="M35 69 42 79 49 70 56 79 63 69"
          fill="white"
          stroke={ink}
          strokeWidth="1.5"
        />
      )}
      {d === "whiskers" && (
        <g stroke={ink} strokeWidth="2" strokeLinecap="round">
          <path d="m18 61 13 3m-13 6 13-2m51-7-13 3m13 6-13-2" />
          <path d="m45 63 5 4 5-4Z" fill={ink} />
        </g>
      )}
      {d === "glasses" && (
        <g stroke={ink} strokeWidth="3">
          <circle cx="35" cy="52" r="14" />
          <circle cx="65" cy="52" r="14" />
          <path d="M49 50H51M20 50H14M80 50H86" />
        </g>
      )}
      {d === "disco" && (
        <g fill={ink}>
          <path d="M21 43H48L45 59H28ZM52 43H79L73 59H56Z" />
          <path d="M45 46H56" stroke={ink} strokeWidth="4" />
          <path d="m28 46 11 9m23-9 8 6" stroke="white" strokeWidth="2.5" />
        </g>
      )}
      {d === "crown" && (
        <path
          d="m33 24-3-17 12 8 8-12 8 12 12-8-3 17Z"
          fill="#FFE18A"
          stroke={ink}
          strokeWidth="2"
        />
      )}
      {d === "horn" && (
        <path
          d="m42 31 9-27 8 27Z"
          fill="#FFF8ED"
          stroke={ink}
          strokeWidth="2"
        />
      )}
      {d === "wizard" && (
        <>
          <path
            d="m22 32 31-30 18 30Z"
            fill="#B9A7F3"
            stroke={ink}
            strokeWidth="2"
          />
          <path d="M18 33H79" stroke={ink} strokeWidth="5" />
          <path
            d="m51 13 2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z"
            fill="#FFE18A"
          />
        </>
      )}
      {d === "helmet" && (
        <>
          <ellipse
            cx="50"
            cy="52"
            rx="33"
            ry="35"
            stroke="white"
            strokeWidth="4"
            opacity=".8"
          />
          <path
            d="M26 30Q36 20 47 21"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {d === "bolt" && (
        <path
          d="m48 19-7 13h9l-2 10 12-16H50l4-7"
          fill="#FFE18A"
          stroke={ink}
          strokeWidth="1.5"
        />
      )}
      {d === "tears" && (
        <g fill="#4EB9F9">
          <path d="M26 60q-11 14 0 14t0-14M75 60q-11 14 0 14t0-14" />
        </g>
      )}
      {d === "freckles" && (
        <g fill={ink} opacity=".5">
          <circle cx="24" cy="62" r="1.5" />
          <circle cx="29" cy="64" r="1.5" />
          <circle cx="76" cy="62" r="1.5" />
          <circle cx="71" cy="64" r="1.5" />
        </g>
      )}
      {d === "sprinkles" && (
        <g strokeWidth="3" strokeLinecap="round">
          <path d="m30 30 5 4m28 3 5-4" stroke="#285BF2" />
          <path d="m47 25 5 2m25 52 5 3" stroke="#FF784F" />
          <path d="m21 47 4-4m38 40 4-4" stroke="#FFF8ED" />
        </g>
      )}
      {d === "leaf" && (
        <path
          d="M49 28Q43 7 70 13 66 29 49 28Z"
          fill="#7CC997"
          stroke={ink}
          strokeWidth="2"
        />
      )}
      {d === "flower" && (
        <g fill="#FFACD6" stroke={ink} strokeWidth="1">
          <circle cx="69" cy="25" r="7" />
          <circle cx="79" cy="25" r="7" />
          <circle cx="74" cy="16" r="7" />
          <circle cx="74" cy="24" r="4" fill="#FFE18A" />
        </g>
      )}
      {d === "ring" && (
        <path
          d="M17 56C-8 76 37 86 79 64S83 32 78 37"
          stroke={ink}
          strokeWidth="9"
          strokeLinecap="round"
        />
      )}
      {d === "ring" && (
        <path
          d="M17 56C-8 76 37 86 79 64S83 32 78 37"
          stroke="#FFE18A"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
      {d === "beak" && (
        <path
          d="M36 66Q51 60 68 69L55 78 38 74Z"
          fill="#FF984F"
          stroke={ink}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
