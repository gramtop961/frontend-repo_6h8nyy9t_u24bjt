import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function RestaurantCard({ restaurant, onSelect }) {
  return (
    <button onClick={() => onSelect(restaurant)} className="text-left bg-white rounded-xl shadow hover:shadow-lg transition p-4">
      <img src={restaurant.image} alt={restaurant.name} className="h-40 w-full object-cover rounded-lg" />
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{restaurant.name}</h3>
          <span className="text-sm font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">⭐ {restaurant.rating}</span>
        </div>
        <p className="text-sm text-gray-500">{restaurant.cuisine} • {restaurant.delivery_time_min} min</p>
        {restaurant.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{restaurant.description}</p>
        )}
      </div>
    </button>
  )
}

function MenuItemRow({ item, onAdd }) {
  return (
    <div className="flex gap-4 bg-white rounded-lg p-4 shadow-sm">
      <img src={item.image} alt={item.name} className="h-20 w-24 object-cover rounded" />
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{item.name}</h4>
        {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
        <p className="text-sm text-gray-800 font-medium mt-1">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center">
        <button onClick={() => onAdd(item)} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
      </div>
    </div>
  )
}

function Cart({ items, onRemove, onCheckout, restaurant }) {
  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  return (
    <div className="sticky top-4 bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">Your Cart</h3>
      {restaurant && (
        <p className="text-sm text-gray-600 mb-2">From: <span className="font-medium">{restaurant.name}</span></p>
      )}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No items yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it._id} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-medium">{it.name}</p>
                <p className="text-gray-500">${it.price.toFixed(2)} × {it.quantity}</p>
              </div>
              <button className="text-red-600 hover:underline" onClick={() => onRemove(it._id)}>Remove</button>
            </div>
          ))}
          <div className="pt-3 border-t">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">Checkout</button>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [restaurants, setRestaurants] = useState([])
  const [active, setActive] = useState(null)
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const r = await fetch(`${API_BASE}/restaurants`)
        const data = await r.json()
        setRestaurants(data)
        setLoading(false)
      } catch (e) {
        setError('Failed to load restaurants')
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectRestaurant = async (r) => {
    setActive(r)
    try {
      const res = await fetch(`${API_BASE}/restaurants/${r._id}/menu`)
      const items = await res.json()
      setMenu(items)
      setCart([])
    } catch (e) {
      setError('Failed to load menu')
    }
  }

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((i) => i._id === item._id)
      if (exists) {
        return prev.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i._id !== id))
  }

  const checkout = async () => {
    if (!active || cart.length === 0) return
    const payload = {
      restaurant_id: active._id,
      customer_name: 'Guest',
      address: '123 Main St',
      phone: '555-1234',
      items: cart.map((c) => ({ menu_item_id: c._id, name: c.name, quantity: c.quantity, price: c.price })),
    }
    const res = await fetch(`${API_BASE}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    alert(`Order placed! Total: $${data.total}`)
    setCart([])
  }

  const seed = async () => {
    await fetch(`${API_BASE}/seed`, { method: 'POST' })
    const r = await fetch(`${API_BASE}/restaurants`)
    setRestaurants(await r.json())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">QuickBite</h1>
          <div className="flex items-center gap-3">
            <button onClick={seed} className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">Load demo data</button>
            <a href="/test" className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">Check backend</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {loading ? (
            <div className="text-gray-600">Loading restaurants...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : active ? (
            <div className="space-y-4">
              <button className="text-sm text-blue-600 hover:underline" onClick={() => setActive(null)}>&larr; Back to restaurants</button>
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <img src={active.image} alt={active.name} className="h-52 w-full object-cover" />
                <div className="p-4">
                  <h2 className="text-xl font-bold">{active.name}</h2>
                  <p className="text-gray-600">{active.cuisine} • ⭐ {active.rating} • {active.delivery_time_min} min</p>
                </div>
              </div>
              <div className="grid gap-4">
                {menu.map((mi) => (
                  <MenuItemRow key={mi._id} item={mi} onAdd={addToCart} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.map((r) => (
                <RestaurantCard key={r._id} restaurant={r} onSelect={selectRestaurant} />
              ))}
              {restaurants.length === 0 && (
                <div className="col-span-full text-gray-600">
                  No restaurants yet. Click "Load demo data" to seed sample content.
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <Cart items={cart} onRemove={removeFromCart} onCheckout={checkout} restaurant={active} />
        </div>
      </main>
    </div>
  )
}

export default App
