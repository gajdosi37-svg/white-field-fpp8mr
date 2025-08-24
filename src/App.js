import React, { useMemo, useState, useEffect } from "react";

/* ---- CSV beolvasas + validalas ---- */
function parseCSVWithValidation(text) {
  const errors = [];
  const rows = [];

  const lines = text.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0)
    return { rows, errors: [{ line: 1, msg: "Ures fajl" }] };

  const headerLine = nonEmpty[0];
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = headerLine
    .split(delimiter)
    .map((h) => h.trim().toLowerCase());

  const needed = ["brand", "model", "year", "body", "image_url"];
  needed.forEach((n) => {
    if (!headers.includes(n))
      errors.push({ line: 1, msg: `Hianyzo oszlop a fejlecben: "${n}"` });
  });

  for (let i = 1; i < nonEmpty.length; i++) {
    const line = nonEmpty[i];
    const parts = line.split(delimiter).map((p) => p.trim());
    if (parts.every((p) => p === "")) continue;

    const obj = {};
    headers.forEach((h, idx) => (obj[h] = parts[idx] ?? ""));

    obj.brand = obj.brand || obj.marka || obj.make || "";
    obj.model = obj.model || obj.type || "";
    obj.body = obj.body || obj.category || "";
    obj.image_url = obj.image_url || obj.image || obj.url || "";

    if (obj.year) {
      const n = Number(obj.year);
      if (Number.isNaN(n)) {
        errors.push({ line: i + 1, msg: `Ev nem szam: "${obj.year}"` });
        obj.year = undefined;
      } else obj.year = n;
    } else obj.year = undefined;

    if (!obj.brand) errors.push({ line: i + 1, msg: "Hianyzo brand" });
    if (!obj.model) errors.push({ line: i + 1, msg: "Hianyzo model" });

    rows.push(obj);
  }

  return { rows, errors };
}

/* ---- Mintaadatok ---- */
const DEFAULT_DATA = [
  {
    brand: "BMW",
    model: "M3",
    year: 2016,
    body: "sedan",
    image_url:
      "https://images.unsplash.com/photo-1549921296-3a6b3f19f5b9?q=80&w=1600&auto=format&fit=crop",
  },
  {
    brand: "Audi",
    model: "RS6",
    year: 2020,
    body: "wagon",
    image_url:
      "https://images.unsplash.com/photo-1549921298-c0a0b1b84a6a?q=80&w=1600&auto=format&fit=crop",
  },
  {
    brand: "Toyota",
    model: "Supra",
    year: 1998,
    body: "coupe",
    image_url:
      "https://images.unsplash.com/photo-1622737133809-d95047b9e673?q=80&w=1600&auto=format&fit=crop",
  },
];

/* ---- Hash-utvonal seged ---- */
function makeCarPath(item) {
  const b = encodeURIComponent(String(item.brand || "").toLowerCase());
  const m = encodeURIComponent(String(item.model || "").toLowerCase());
  const y = item.year ? `/${encodeURIComponent(String(item.year))}` : "";
  return `#/car/${b}/${m}${y}`;
}
function readRoute() {
  const raw = (window.location.hash || "").replace(/^#/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts[0] === "car" && (parts[1] || parts[2])) {
    return {
      name: "car",
      brand: parts[1] || "",
      model: parts[2] || "",
      year: parts[3] || "",
    };
  }
  return { name: "home" };
}

/* ---- Kedvencek kulcs ---- */
function favKey(d) {
  return `${(d.brand || "").toLowerCase()}|${(d.model || "").toLowerCase()}|${
    d.year || ""
  }`;
}

/* ---- UI elemek ---- */
function Heart({ active }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 18,
        height: 18,
        lineHeight: "18px",
        textAlign: "center",
        borderRadius: 4,
        border: active ? "1px solid #c00" : "1px solid #ccc",
        background: active ? "#ffecec" : "#fff",
        color: active ? "#c00" : "#666",
        fontSize: 12,
        userSelect: "none",
      }}
    >
      {active ? "❤" : "♡"}
    </span>
  );
}

function Card({ item, onOpen, isFav, toggleFav }) {
  return (
    <a
      href={makeCarPath(item)}
      onClick={(e) => {
        e.preventDefault();
        onOpen(item);
      }}
      style={{
        border: "1px solid #ddd",
        borderRadius: 10,
        overflow: "hidden",
        margin: 10,
        width: 260,
        background: "#fff",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        position: "relative",
      }}
      title={`${item.brand} ${item.model} ${item.year ?? ""}`}
    >
      {/* Sziv gomb */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFav(item);
        }}
        title={
          isFav ? "Eltavolitas a kedvencekbol" : "Hozzaadas a kedvencekhez"
        }
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          border: "1px solid #ddd",
          background: "#fff",
          borderRadius: 6,
          padding: "4px 6px",
          cursor: "pointer",
        }}
      >
        <Heart active={isFav} />
      </button>

      <div style={{ height: 150, background: "#eee" }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={`${item.brand} ${item.model}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#888",
              fontSize: 12,
            }}
          >
            Nincs kep
          </div>
        )}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontWeight: 600 }}>
          {item.brand} {item.model}
        </div>
        {item.year && <div>Evjarat: {item.year}</div>}
        {item.body && <div>Karosszeria: {item.body}</div>}
      </div>
    </a>
  );
}

/* MiniCard a "Hasonlo" reszhez (sziv itt is mukodik) */
function MiniCard({ item, onOpen, isFav, toggleFav }) {
  return (
    <a
      href={makeCarPath(item)}
      onClick={(e) => {
        e.preventDefault();
        onOpen(item);
      }}
      style={{
        border: "1px solid #eee",
        borderRadius: 10,
        overflow: "hidden",
        width: 180,
        textDecoration: "none",
        color: "inherit",
        background: "#fff",
        display: "block",
        position: "relative",
      }}
      title={`${item.brand} ${item.model} ${item.year ?? ""}`}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleFav(item);
        }}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          border: "1px solid #ddd",
          background: "#fff",
          borderRadius: 6,
          padding: "3px 5px",
          cursor: "pointer",
        }}
        title={
          isFav ? "Eltavolitas a kedvencekbol" : "Hozzaadas a kedvencekhez"
        }
      >
        <Heart active={isFav} />
      </button>

      <div style={{ height: 100, background: "#f0f0f0" }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={`${item.brand} ${item.model}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : null}
      </div>
      <div style={{ padding: 8, fontSize: 14 }}>
        <div
          style={{
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.brand} {item.model}
        </div>
        <div style={{ color: "#666" }}>{item.year || "-"}</div>
      </div>
    </a>
  );
}

function Stat({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        background: "#fafafa",
        borderRadius: 10,
        padding: "10px 12px",
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/* ---- Modell-oldal (javított, affiliate linkekkel) ---- */
function ModelPage({ item, onBack, onOpen, similar, isFav, toggleFav }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!item) {
    return (
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
        <button
          onClick={onBack}
          style={{
            border: "1px solid #ddd",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Vissza
        </button>
        <h2>Nem talalhato ez a modell.</h2>
        <p>Ellenorizd, hogy ugyanazt a CSV-t toltotted-e be.</p>
      </div>
    );
  }

  const isFavMap = isFav && isFav.map ? isFav.map : {};
  const favActive =
    isFavMap[
      `${(item.brand || "").toLowerCase()}|${(
        item.model || ""
      ).toLowerCase()}|${item.year || ""}`
    ] || false;

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={onBack}
          style={{
            border: "1px solid #ddd",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Vissza
        </button>
        <button
          onClick={() => toggleFav(item)}
          style={{
            border: "1px solid #ddd",
            padding: "8px 12px",
            borderRadius: 8,
            cursor: "pointer",
            background: favActive ? "#ffecec" : "#fff",
          }}
          title={
            favActive
              ? "Eltavolitas a kedvencekbol"
              : "Hozzaadas a kedvencekhez"
          }
        >
          <span style={{ marginRight: 6 }}>{favActive ? "❤" : "♡"}</span>{" "}
          Kedvenc
        </button>
      </div>

      <h1 style={{ fontSize: 34, marginTop: 16 }}>
        {item.brand} {item.model} {item.year ? `(${item.year})` : ""}
      </h1>

      <div style={{ background: "#111", borderRadius: 12, overflow: "hidden" }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={`${item.brand} ${item.model}`}
            style={{ width: "100%", maxHeight: 520, objectFit: "contain" }}
          />
        ) : (
          <div style={{ color: "#bbb", textAlign: "center", padding: 40 }}>
            Nincs kep
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, color: "#555" }}>
        <div>
          <strong>Marka:</strong> {item.brand || "-"}
        </div>
        <div>
          <strong>Modell:</strong> {item.model || "-"}
        </div>
        <div>
          <strong>Evjarat:</strong> {item.year || "-"}
        </div>
        <div>
          <strong>Karosszeria:</strong> {item.body || "-"}
        </div>
      </div>

      {/* Megosztás */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={copyLink}
          style={{
            border: "1px solid #0c0",
            background: "#eaffea",
            borderRadius: 8,
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📋 Megosztas / Link masolasa
        </button>
        {copied && (
          <span style={{ marginLeft: 10, color: "green" }}>
            Link kimasolva!
          </span>
        )}
      </div>

      {/* Ajánlott kiegészítők – IDE RAKD A SAJÁT LINKJEIDET */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #eee",
          borderRadius: 12,
          background: "#fafafa",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Ajanlott kiegeszitok
        </div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <a
              href="https://www.amazon.co.uk/dp/B00652G4TS?tag=carcatalog37-20"
              target="_blank"
              rel="noreferrer"
            >
              OBD2 Bluetooth adapter
            </a>
          </li>
          <li>
            <a
              href="https://www.amazon.co.uk/URAQT-Microfibre-Cleaning-Cloths-Pack/dp/B0B7WFY7GG?tag=carcatalog37-20
              "
              target="_blank"
              rel="noreferrer"
            >
              Autosampon es mikroszalas kendo
            </a>
          </li>
          <li>
            <a
              href="https://www.amazon.co.uk/VANMASS-Suction-Military-Protection%E3%80%91Multi-Scene-Certs%E3%80%91Dash/dp/B07Z3K8YWR/ref=sr_1_1_sspa?crid=G0HD8ZPAM133&dib=eyJ2IjoiMSJ9.49FPvBHn1HEGawSZ8wk4PVTO0tD0-krYgSr_WG1oJ5ApVchS_DsupKUMHSs0kwVdVVu6Ch9cvLEVxwTAcwUCgHG6Vr0kN_6Bxj-nM_2StCD3Uuce5mOGJfkNFWFGmD8bde5YTZ62fZ6VIsTD3HKCP5rPOP-kZp0rH9OBt0XzGN2CKPobESLHOZj2gq1nMCP_DDK4Aswk0vb_TCGjOGB7XFLVVAKyXJEHa_F4GLb5gH4Q3XEBROBjUwvTrrp9yhcJGf-ETtplpMkmBmd9zpFR2d10rE6xUOj18SLIzBRFqAU.SFi2o6M1cqsrWuUPXpavMuJ2bEWGMGJyAzGLmhpVZvQ&dib_tag=se&keywords=car%2Bphone%2Bholder&qid=1756066723&s=automotive&sprefix=car%2Bphone%2Cautomotive%2C139&sr=1-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1tag=carcatalog37-20"
              target="_blank"
              rel="noreferrer"
            >
              Telefontarto
            </a>
          </li>
        </ul>
      </div>

      {/* Hasonlo modellek */}
      {similar && similar.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 10 }}>Hasonlo modellek</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {similar.map((s, i) => (
              <a
                key={i}
                href={makeCarPath(s)}
                onClick={(e) => {
                  e.preventDefault();
                  onOpen(s);
                }}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  overflow: "hidden",
                  width: 180,
                  textDecoration: "none",
                  color: "inherit",
                  background: "#fff",
                  display: "block",
                }}
                title={`${s.brand} ${s.model} ${s.year ?? ""}`}
              >
                <div style={{ height: 100, background: "#f0f0f0" }}>
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={`${s.brand} ${s.model}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div style={{ padding: 8, fontSize: 14 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.brand} {s.model}
                  </div>
                  <div style={{ color: "#666" }}>{s.year || "-"}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Foalkalmazas ---- */
export default function App() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [body, setBody] = useState("all");
  const [errors, setErrors] = useState([]);
  const [route, setRoute] = useState(readRoute());

  // Kedvencek: Set + map a gyors ellenorzeshez
  const [favs, setFavs] = useState({ set: new Set(), map: {} });
  const [onlyFavs, setOnlyFavs] = useState(false);

  // Betoltes localStorage-bol
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auto_catalog_favs");
      if (raw) {
        const arr = JSON.parse(raw);
        const set = new Set(arr);
        const map = {};
        arr.forEach((k) => (map[k] = true));
        setFavs({ set, map });
      }
    } catch {}
  }, []);

  // Mentes localStorage-ba
  useEffect(() => {
    try {
      localStorage.setItem(
        "auto_catalog_favs",
        JSON.stringify(Array.from(favs.set))
      );
    } catch {}
  }, [favs]);

  function toggleFav(item) {
    const key = favKey(item);
    setFavs((prev) => {
      const set = new Set(prev.set);
      const map = { ...prev.map };
      if (set.has(key)) {
        set.delete(key);
        delete map[key];
      } else {
        set.add(key);
        map[key] = true;
      }
      return { set, map };
    });
  }

  function isFavItem(item) {
    return favs.set.has(favKey(item));
  }

  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const brands = useMemo(() => {
    const s = new Set(data.map((d) => (d.brand || "").trim()).filter(Boolean));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [data]);

  const bodies = useMemo(() => {
    const s = new Set(data.map((d) => (d.body || "").trim()).filter(Boolean));
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [data]);

  const filteredBase = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((x) => {
      const okBrand =
        brand === "all" ||
        (x.brand || "").toLowerCase() === brand.toLowerCase();
      const okBody =
        body === "all" || (x.body || "").toLowerCase() === body.toLowerCase();
      const text = `${x.brand || ""} ${x.model || ""} ${x.body || ""} ${
        x.year || ""
      }`.toLowerCase();
      const okQuery = q.length === 0 || text.includes(q);
      return okBrand && okBody && okQuery;
    });
  }, [data, brand, body, query]);

  const filtered = useMemo(() => {
    if (!onlyFavs) return filteredBase;
    return filteredBase.filter((x) => isFavItem(x));
  }, [filteredBase, onlyFavs]);

  const stats = useMemo(() => {
    const brandSet = new Set(
      data.map((d) => (d.brand || "").trim()).filter(Boolean)
    );
    const modelSet = new Set(
      data
        .map((d) => `${(d.brand || "").trim()}|${(d.model || "").trim()}`)
        .filter(Boolean)
    );
    const images = data.filter((d) => (d.image_url || "").length > 5).length;
    const favCount = Array.from(data).filter((d) =>
      favs.set.has(favKey(d))
    ).length;
    return {
      brands: brandSet.size,
      models: modelSet.size,
      images,
      favs: favCount,
    };
  }, [data, favs]);

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result?.toString() || "";
      const { rows, errors } = parseCSVWithValidation(text);
      setErrors(errors);
      if (rows.length) {
        setData(rows);
        setBrand("all");
        setBody("all");
        setQuery("");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function openModelPage(item) {
    window.location.hash = makeCarPath(item).slice(1);
  }
  function goHome() {
    window.location.hash = "";
  }

  // Modell-oldal
  if (route.name === "car") {
    const item = data.find((d) => {
      const b = encodeURIComponent(String(d.brand || "").toLowerCase());
      const m = encodeURIComponent(String(d.model || "").toLowerCase());
      const y = d.year ? String(d.year) : "";
      return (
        b === (route.brand || "") &&
        m === (route.model || "") &&
        (route.year ? String(route.year) === y : true)
      );
    });

    const similar = item
      ? data
          .filter((d) => {
            const sameBrand =
              (d.brand || "").toLowerCase() ===
              (item.brand || "").toLowerCase();
            const sameBody =
              (d.body || "").toLowerCase() === (item.body || "").toLowerCase();
            const sameKey = favKey(d);
            const thisKey = favKey(item);
            return (sameBrand || sameBody) && sameKey !== thisKey;
          })
          .slice(0, 8)
      : [];

    return (
      <ModelPage
        item={item}
        onBack={goHome}
        onOpen={openModelPage}
        similar={similar}
        isFav={{
          map: Object.fromEntries(Array.from(favs.set).map((k) => [k, true])),
        }}
        toggleFav={toggleFav}
      />
    );
  }

  /* Home lista */
  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginTop: 0, fontSize: 32 }}>Auto Katalogus</h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input type="file" accept=".csv" onChange={onFile} />
        <input
          placeholder="Kereses pl.: BMW M3 / coupe / 2016"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: 8,
            border: "1px solid #ddd",
            borderRadius: 8,
            minWidth: 240,
          }}
        />
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              Marka: {b}
            </option>
          ))}
        </select>
        <select
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
        >
          {bodies.map((b) => (
            <option key={b} value={b}>
              Karosszeria: {b}
            </option>
          ))}
        </select>

        {/* Csak kedvencek kapcsolo */}
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginLeft: 6,
          }}
        >
          <input
            type="checkbox"
            checked={onlyFavs}
            onChange={(e) => setOnlyFavs(e.target.checked)}
          />
          Csak kedvencek
        </label>
      </div>

      <div
        style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}
      >
        <Stat label="Markak" value={stats.brands} />
        <Stat label="Modellek" value={stats.models} />
        <Stat label="Kepek (URL)" value={stats.images} />
        <Stat label="Kedvencek" value={stats.favs} />
        <Stat label="Talalatok (szurve)" value={filtered.length} />
      </div>

      {errors.length > 0 && (
        <div
          style={{
            border: "1px solid #ffd9d9",
            background: "#fff4f4",
            color: "#b10000",
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <strong>{errors.length} hiba a CSV-ben:</strong>
          <ul style={{ margin: "8px 0 0 18px" }}>
            {errors.slice(0, 10).map((e, i) => (
              <li key={i}>
                Sor {e.line}: {e.msg}
              </li>
            ))}
          </ul>
          {errors.length > 10 && (
            <div>Tovabbi hibak szama: {errors.length - 10}</div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {filtered.map((item, i) => (
          <Card
            key={i}
            item={item}
            onOpen={openModelPage}
            isFav={isFavItem(item)}
            toggleFav={toggleFav}
          />
        ))}
      </div>
    </div>
  );
}
