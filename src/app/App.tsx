import { RouterProvider } from 'react-router';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

// ── Why this layout matters ───────────────────────────────────────────────────
// AuthProvider uses useNavigate() (to redirect on session expiry).
// useNavigate() only works inside the router tree.
// So RouterProvider must be the outermost wrapper, with AuthProvider
// rendered as part of the route layout — not above RouterProvider.
//
// The cleanest way: add AuthProvider to your root layout component in routes.tsx
// rather than here. The example below shows the recommended pattern.
//
// In routes.tsx, wrap your root layout:
//
//   import { AuthProvider } from './contexts/AuthContext';
//   import { CartProvider } from './contexts/CartContext';
//   import { WishlistProvider } from './contexts/WishlistContext';
//
//   function RootLayout() {
//     return (
//       <AuthProvider>
//         <CartProvider>
//           <WishlistProvider>
//             <Outlet />
//           </WishlistProvider>
//         </CartProvider>
//       </AuthProvider>
//     );
//   }
//
//   export const router = createBrowserRouter([
//     { path: '/', element: <RootLayout />, children: [...] }
//   ]);

export default function App() {
  return (
    <ThemeProvider>
      {/*
        RouterProvider is outermost so every route has access to the router context.
        AuthProvider, CartProvider, WishlistProvider belong inside a root layout
        route (see comment above) so they can use useNavigate and other router hooks.
      */}
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}