interface Nutrition {
  calories?: string
  vitamins?: string[]
  benefits?: string[]
  info?: string
}

interface RecommendationProps {
  recipes: string[]
  nutrition: Nutrition
  storageTips: string
}

export default function Recommendation({ recipes, nutrition, storageTips }: RecommendationProps) {
  if (!recipes || recipes.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Recipes Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🍳 Rekomendasi Resep
        </h3>
        <ul className="space-y-2">
          {recipes.map((recipe, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg"
            >
              <span className="text-orange-500 font-bold">{idx + 1}.</span>
              <span className="text-gray-700">{recipe}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Nutrition Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🥗 Informasi Nutrisi
        </h3>
        {nutrition.info ? (
          <p className="text-gray-600">{nutrition.info}</p>
        ) : (
          <div className="space-y-3">
            {nutrition.calories && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm text-gray-500">Kalori</p>
                  <p className="font-medium text-gray-700">{nutrition.calories}</p>
                </div>
              </div>
            )}
            {nutrition.vitamins && nutrition.vitamins.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Vitamin</p>
                <div className="flex flex-wrap gap-2">
                  {nutrition.vitamins.map((vitamin, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {vitamin}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {nutrition.benefits && nutrition.benefits.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Manfaat</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {nutrition.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Storage Tips Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📦 Tips Penyimpanan
        </h3>
        <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
          {storageTips}
        </p>
      </div>
    </div>
  )
}
