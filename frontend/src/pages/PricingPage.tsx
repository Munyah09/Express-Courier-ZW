export function PricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pricing Advisor</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          All prices are set manually per shipment. Use this page as a reference guide — not a fixed rate card.
          Many factors influence the final price: route, urgency, parcel type, fuel, season, and customer relationship.
        </p>
      </div>

      {/* Advisory banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex gap-3">
        <span className="text-2xl mt-0.5">💡</span>
        <div>
          <p className="font-semibold text-amber-900">Custom Pricing Model</p>
          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
            Starverse Express uses fully negotiated pricing. No fixed rates are applied automatically.
            When creating a shipment, enter the agreed delivery charge in the "Delivery Charge" field.
            The figures below are suggested starting points — not binding rates.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Route distance guide */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">🗺️ Route Distance Categories</h2>
          <div className="space-y-3">
            {[
              { label: 'Same City / Local', desc: 'e.g. Harare CBD to Chitungwiza', range: '$1 – $5', icon: '🏙️', color: 'bg-green-50 border-green-200' },
              { label: 'Short Intercity', desc: 'e.g. Harare to Marondera, Gweru to Kwekwe', range: '$5 – $12', icon: '🛣️', color: 'bg-blue-50 border-blue-200' },
              { label: 'Medium Intercity', desc: 'e.g. Harare to Gweru, Bulawayo to Masvingo', range: '$10 – $20', icon: '🚚', color: 'bg-purple-50 border-purple-200' },
              { label: 'Long Intercity', desc: 'e.g. Harare to Bulawayo, Harare to Mutare', range: '$15 – $30', icon: '🗺️', color: 'bg-orange-50 border-orange-200' },
              { label: 'Cross-Country', desc: 'e.g. Harare to Beitbridge, Harare to Victoria Falls', range: '$25 – $50+', icon: '🏁', color: 'bg-red-50 border-red-200' },
            ].map(r => (
              <div key={r.label} className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${r.color}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.label}</p>
                    <p className="text-xs text-slate-500">{r.desc}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-800 shrink-0 ml-3">{r.range}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Suggested ranges based on typical market rates. Adjust for weight, urgency, and customer agreement.</p>
        </div>

        {/* Weight & type adjustments */}
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">⚖️ Weight Adjustments</h2>
            <div className="space-y-2">
              {[
                ['Under 1 kg', 'Base price — no adjustment'],
                ['1–5 kg', 'Add 30–50% to base'],
                ['5–10 kg', 'Add 70–100% to base'],
                ['10–25 kg', 'Double to triple base'],
                ['25–50 kg', 'Negotiate per trip'],
                ['50+ kg', 'Bulk rate — discuss with customer'],
              ].map(([range, note]) => (
                <div key={range} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                  <span className="font-semibold text-slate-900">{range}</span>
                  <span className="text-slate-500 text-xs">{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">📦 Special Handling Surcharges</h2>
            <div className="space-y-2">
              {[
                ['Fragile / Breakable', '+15–20% of base'],
                ['Insurance Cover', '2–3% of declared value'],
                ['Home Delivery (urban)', 'Add $1–$3'],
                ['Bike / Last Mile', 'Custom — $2–$8 typical'],
                ['Urgent / Same Day', '+30–50% premium'],
                ['Mushika Shika / Kombi', 'Negotiate per seat/package'],
              ].map(([type, note]) => (
                <div key={type} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                  <span className="font-semibold text-slate-900">{type}</span>
                  <span className="text-slate-500 text-xs">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zimbabwe route quick reference */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4">🇿🇼 Zimbabwe Route Quick Reference</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-slate-500">Route</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-slate-500">Via</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-slate-500">Approx. Distance</th>
                <th className="text-left py-2 px-3 text-xs font-semibold uppercase text-slate-500">Suggested Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                ['Harare → Zvishavane', 'Masvingo Road', '~290 km', '$12–$22'],
                ['Harare → Zvishavane', 'Bulawayo Road (via Gweru)', '~330 km', '$14–$25'],
                ['Harare → Bulawayo', 'Midlands (Norton, Kwekwe, Gweru)', '~440 km', '$18–$30'],
                ['Harare → Mutare', 'Eastern Highlands', '~260 km', '$12–$20'],
                ['Harare → Masvingo', 'Beatrice, Chivhu, Mvuma', '~290 km', '$12–$20'],
                ['Harare → Beitbridge', 'Masvingo, Ngundu', '~580 km', '$25–$45'],
                ['Harare → Victoria Falls', 'Bulawayo, Hwange', '~900 km', '$40–$70'],
                ['Harare → Kariba', 'Chinhoyi, Karoi', '~365 km', '$15–$28'],
                ['Bulawayo → Beitbridge', 'Gwanda, West Nicholson', '~320 km', '$14–$25'],
                ['Mutare → Chipinge', 'Skyline Junction', '~160 km', '$8–$15'],
              ].map(([route, via, dist, range]) => (
                <tr key={route + via} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-medium text-slate-900">{route}</td>
                  <td className="py-2.5 px-3 text-slate-500">{via}</td>
                  <td className="py-2.5 px-3 text-slate-500">{dist}</td>
                  <td className="py-2.5 px-3 font-semibold text-brand-700">{range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          All ranges are for a standard parcel under 5 kg. Heavy or bulky items should be negotiated separately.
          These are starting-point suggestions only — the agreed price always takes precedence.
        </p>
      </div>

      {/* CTA */}
      <div className="rounded-3xl border-2 border-brand-200 bg-brand-50 p-6 text-center">
        <p className="text-sm font-semibold text-brand-900 mb-1">Ready to create a shipment?</p>
        <p className="text-xs text-brand-700 mb-4">Enter the agreed delivery charge when creating the parcel.</p>
        <a
          href="/create"
          className="inline-block rounded-2xl bg-brand-500 px-8 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
        >
          📦 Create Shipment
        </a>
      </div>
    </div>
  );
}
