import { useCallback, useEffect, useMemo, useState } from "react";
import { cartAPI } from "@/services/cart";
import { inventoryAPI } from "@/services/inventory";

export function useCart({ user, notify }) {
  const [localCart, setLocalCart] = useState([]);
  const [serverCart, setServerCart] = useState(null);
  const [piecesDetails, setPiecesDetails] = useState({});

  const refreshServerCart = useCallback(async () => {
    if (!user) return;
    try {
      const summary = await cartAPI.getCart();
      setServerCart(summary);

      if (summary.items && summary.items.length > 0) {
        const woodPieceIds = [
          ...new Set(summary.items.map((item) => item.wood_piece_id)),
        ];

        const piecesPromises = woodPieceIds.map((id) =>
          inventoryAPI.getPiece(id).catch((err) => {
            console.error(`Error loading piece ${id}:`, err);
            return null;
          }),
        );

        const pieces = await Promise.all(piecesPromises);

        const piecesMap = {};
        pieces.forEach((piece, index) => {
          if (piece) {
            piecesMap[woodPieceIds[index]] = piece;
          }
        });

        setPiecesDetails(piecesMap);
      } else {
        setPiecesDetails({});
      }
    } catch (err) {
      console.error("Error cargando carrito:", err.message);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshServerCart();
    else setServerCart(null);
  }, [user, refreshServerCart]);

  const addToCart = useCallback(
    async (item) => {
      if (user) {
        try {
          await cartAPI.addItem(item.id, 1);
          await refreshServerCart();
          notify?.(
            (item.woodName || item.nombre || item.name) + " agregado al carrito",
          );
        } catch (err) {
          notify?.(err.message || "Error al agregar al carrito", "error");
        }
        return;
      }
      setLocalCart((prev) => {
        const existing = prev.find((c) => c.id === item.id);
        if (existing) {
          return prev.map((c) =>
            c.id === item.id ? { ...c, qty: c.qty + 1 } : c,
          );
        }
        return [...prev, { ...item, qty: 1 }];
      });
      notify?.((item.woodName || item.name) + " agregado al carrito");
    },
    [user, refreshServerCart, notify],
  );

  const removeFromCart = useCallback(
    async (item_id) => {
      if (user && serverCart) {
        try {
          await cartAPI.removeItem(item_id);
          await refreshServerCart();
        } catch (err) {
          notify?.(err.message || "Error al eliminar del carrito", "error");
        }
        return;
      }
      setLocalCart((prev) => prev.filter((c) => c.id !== item_id));
    },
    [user, serverCart, refreshServerCart, notify],
  );

  const updateCartQty = useCallback(
    async (item_id, qty) => {
      if (qty <= 0) {
        removeFromCart(item_id);
        return;
      }

      if (user && serverCart) {
        try {
          await cartAPI.updateItem(item_id, qty);
          await refreshServerCart();
        } catch (err) {
          console.error("Error actualizando cantidad:", err);
          notify?.(err.message || "Error al actualizar cantidad", "error");
        }
        return;
      }
      setLocalCart((prev) =>
        prev.map((c) => (c.id === item_id ? { ...c, qty } : c)),
      );
    },
    [user, serverCart, removeFromCart, refreshServerCart, notify],
  );

  const cart = useMemo(() => {
    if (user && serverCart) {
      const sortedItems = [...(serverCart.items || [])].sort(
        (a, b) => a.id - b.id,
      );

      return sortedItems.map((item) => {
        const piece = piecesDetails[item.wood_piece_id];

        if (!piece) {
          return {
            id: item.id,
            pieceId: item.wood_piece_id,
            tipo_madera_id: null,
            medida_id: null,
            woodName: "Cargando...",
            emoji: "🪵",
            price: 0,
            qty: item.cantidad,
            quantity: item.cantidad,
            largo_m: 0,
            ancho_in: 0,
            alto_in: 0,
            volumen_m3: 0,
            unit_price: 0,
            total_price: 0,
          };
        }

        const largo_m = Number(piece.largo_m ?? 0) || 0;
        const ancho_in = Number(piece.medida?.ancho_in ?? 0) || 0;
        const alto_in = Number(piece.medida?.alto_in ?? 0) || 0;

        const price = piece.precio_unitario ? Number(piece.precio_unitario) : 0;

        const woodName = piece.tipo_madera?.nombre || "Madera";

        const getWoodEmoji = (nombre) => {
          const emojis = {
            Cedro: "🌲",
            Roble: "🌳",
            Pino: "🌲",
            Caoba: "🪵",
            Guayacán: "🌴",
          };
          return emojis[nombre] || "🪵";
        };

        return {
          id: item.id,
          pieceId: item.wood_piece_id,
          tipo_madera_id: piece.tipo_madera?.id ?? piece.tipo_madera_id ?? null,
          medida_id: piece.medida?.id ?? piece.medida_id ?? null,
          woodName,
          emoji: getWoodEmoji(woodName),
          price,
          qty: item.cantidad,
          quantity: item.cantidad,
          largo_m,
          ancho_in,
          alto_in,
          volumen_m3: piece.volumen_m3 ? Number(piece.volumen_m3) : 0,
          unit_price: price,
          total_price: price * item.cantidad,
          stock: piece.stock || 0,
          estado: piece.estado,
          added_at: item.added_at,
        };
      });
    }
    return localCart.map((item) => {
      const price = Number(item.price ?? item.unit_price ?? 0) || 0;
      const qty = Number(item.qty ?? 1) || 1;

      return {
        ...item,
        pieceId: item.pieceId ?? item.id,
        tipo_madera_id: item.tipo_madera_id ?? item.woodTypeId ?? null,
        medida_id: item.medida_id ?? item.measureId ?? null,
        price,
        qty,
        quantity: qty,
        total_price: price * qty,
        ancho_in: Number(item.ancho_in ?? item.ancho ?? 0) || 0,
        alto_in: Number(item.alto_in ?? item.alto ?? 0) || 0,
        largo_m: Number(item.largo_m ?? item.largo ?? 0) || 0,
      };
    });
  }, [user, serverCart, localCart, piecesDetails]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.total_price || 0), 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + (item.qty || 0), 0);
  }, [cart]);

  const clearCart = useCallback(async () => {
    if (user && serverCart) {
      try {
        await cartAPI.clearCart();
        await refreshServerCart();
        notify?.("Carrito vaciado correctamente");
      } catch (err) {
        notify?.(err.message || "Error al vaciar el carrito", "error");
      }
    } else {
      setLocalCart([]);
      notify?.("Carrito vaciado correctamente");
    }
  }, [user, serverCart, refreshServerCart, notify]);

  return {
    cart,
    serverCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    getCartTotal,
    getCartItemCount,
    refreshServerCart,
  };
}