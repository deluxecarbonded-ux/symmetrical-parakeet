import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Coins,
  Crown,
  Flame,
  Gem,
  Headphones,
  KeyRound,
  LockKeyhole,
  Palette,
  Shield,
  Sparkles,
  Star,
  Target,
  WandSparkles,
  Zap,
} from "lucide-react";
import { useApp } from "../App";
import {
  Card,
  LinkButton,
  PageHeader,
  Pill,
  SectionHeading,
  Button,
} from "../components/Primitives";
import { formatNumber } from "../lib/storage";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const catalog = {
  single: [
    {
      id: "single-focus",
      nameKey: "shop.item.singleFocusLens.name",
      typeKey: "shop.type.soloUtility",
      filterKey: "utility",
      price: 120,
      icon: Target,
      tone: "lime",
      descriptionKey: "shop.item.singleFocusLens.description",
    },
    {
      id: "single-ember",
      nameKey: "shop.item.singleEmberTrail.name",
      typeKey: "shop.type.soloVisual",
      filterKey: "visual",
      price: 180,
      icon: Flame,
      tone: "coral",
      descriptionKey: "shop.item.singleEmberTrail.description",
    },
    {
      id: "single-orbit",
      nameKey: "shop.item.singleQuietOrbit.name",
      typeKey: "shop.type.soloFocus",
      filterKey: "visual",
      price: 240,
      icon: Sparkles,
      tone: "violet",
      descriptionKey: "shop.item.singleQuietOrbit.description",
    },
    {
      id: "single-crown",
      nameKey: "shop.item.singlePatternCrown.name",
      typeKey: "shop.type.soloBadge",
      filterKey: "badge",
      price: 360,
      icon: Crown,
      tone: "gold",
      descriptionKey: "shop.item.singlePatternCrown.description",
    },
  ],
  multi: [
    {
      id: "multi-shield",
      nameKey: "shop.item.multiDuelShield.name",
      typeKey: "shop.type.duelDefense",
      filterKey: "defense",
      price: 140,
      icon: Shield,
      tone: "blue",
      descriptionKey: "shop.item.multiDuelShield.description",
    },
    {
      id: "multi-signal",
      nameKey: "shop.item.multiSignalFlare.name",
      typeKey: "shop.type.duelVisual",
      filterKey: "visual",
      price: 210,
      icon: Zap,
      tone: "coral",
      descriptionKey: "shop.item.multiSignalFlare.description",
    },
    {
      id: "multi-wand",
      nameKey: "shop.item.multiQuickDraw.name",
      typeKey: "shop.type.duelUtility",
      filterKey: "utility",
      price: 280,
      icon: WandSparkles,
      tone: "violet",
      descriptionKey: "shop.item.multiQuickDraw.description",
    },
    {
      id: "multi-gem",
      nameKey: "shop.item.multiSharpEdge.name",
      typeKey: "shop.type.duelBadge",
      filterKey: "badge",
      price: 420,
      icon: Gem,
      tone: "lime",
      descriptionKey: "shop.item.multiSharpEdge.description",
    },
  ],
};

export default function Shop({ mode = "single" }) {
  const {
    t,
    wallet,
    inventory,
    settings,
    purchaseItem,
    equipItem,
    showToast,
    realtimeEvent,
  } = useApp();
  const [filter, setFilter] = useState("all");
  const [remoteCatalog, setRemoteCatalog] = useState(null);
  const [catalogVersion, setCatalogVersion] = useState(0);
  useEffect(() => {
    if (realtimeEvent?.table === "shop_items") {
      setCatalogVersion((value) => value + 1);
    }
  }, [realtimeEvent?.id, realtimeEvent?.table]);
  useEffect(() => {
    let cancelled = false;
    if (!isSupabaseConfigured) {
      setRemoteCatalog([]);
      return () => {
        cancelled = true;
      };
    }
    supabase
      .from("shop_items")
      .select("id,scope,price,item_type,metadata,active")
      .eq("scope", mode)
      .eq("active", true)
      .then(({ data, error }) => {
        if (!cancelled) setRemoteCatalog(error ? [] : data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogVersion, mode]);
  const items = useMemo(() => {
    const localItems = catalog[mode] || [];
    if (!remoteCatalog) return localItems;
    const byId = new Map(remoteCatalog.map((item) => [item.id, item]));
    return localItems
      .filter((item) => byId.has(item.id))
      .map((item) => ({
        ...item,
        price: byId.get(item.id).price,
        type: byId.get(item.id).item_type,
      }));
  }, [mode, remoteCatalog]);
  const owned = inventory[mode] || [];
  const equipped = inventory.equipped?.[mode];
  const filtered = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((item) => item.filterKey === filter),
    [filter, items],
  );
  const balance = wallet[mode] || 0;
  const isSingle = mode === "single";

  return (
    <main className="page shop-page">
      <PageHeader
        eyebrow={t("nav.shop")}
        title={t("shop.title")}
        description={t("shop.subtitle")}
        actions={
          <div className="shop-wallet">
            <div className="wallet-orb">
              <Coins size={17} />
            </div>
            <div>
              <strong>{formatNumber(balance, settings.locale)}</strong>
              <span>
                {isSingle ? t("shop.singleBalance") : t("shop.multiBalance")}
              </span>
            </div>
          </div>
        }
      />
      <div className="shop-mode-switch">
        <div className="shop-mode-copy">
          <span className="section-eyebrow">
            {isSingle ? t("dashboard.singleMode") : t("dashboard.multiMode")}
          </span>
          <strong>
            {isSingle ? t("shop.singleBalance") : t("shop.multiBalance")}
          </strong>
        </div>
        <div className="shop-switch-buttons">
          <LinkButton
            to="/single/shop"
            variant={isSingle ? "primary" : "quiet"}
            size="sm"
          >
            {t("dashboard.singleMode")}
          </LinkButton>
          <LinkButton
            to="/multi/shop"
            variant={!isSingle ? "primary" : "quiet"}
            size="sm"
          >
            {t("dashboard.multiMode")}
          </LinkButton>
        </div>
      </div>
      <div className="shop-note">
        <LockKeyhole size={15} />
        <span>{t("shop.note")}</span>
      </div>
      <SectionHeading
        eyebrow={t("shop.inventory")}
        title={t("shop.title")}
        action={
          <div className="shop-filter">
            {["all", "utility", "visual", "badge", "defense"].map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {t(`shop.filter.${item}`)}
              </button>
            ))}
          </div>
        }
      />
      <div className="shop-grid">
        {filtered.map((item) => {
          const Icon = item.icon;
          const isOwned = owned.some((ownedItem) => ownedItem.id === item.id);
          const isEquipped = equipped === item.id;
          return (
            <Card
              key={item.id}
              className={`shop-item shop-item-${item.tone} ${isEquipped ? "is-equipped" : ""}`}
              hover
            >
              <div className="shop-item-visual">
                <div className="item-icon">
                  <Icon size={24} />
                </div>
                <span className="item-type">{t(item.typeKey)}</span>
                {isEquipped && (
                  <Pill tone="light" icon={Check}>
                    {t("shop.equipped")}
                  </Pill>
                )}
              </div>
              <div className="shop-item-copy">
                <h3>{t(item.nameKey)}</h3>
                <p>{t(item.descriptionKey)}</p>
              </div>
              <div className="shop-item-footer">
                {isOwned ? (
                  <Button
                    size="sm"
                    variant={isEquipped ? "quiet" : "primary"}
                    onClick={() =>
                      isEquipped
                        ? showToast("toast.equipped")
                        : equipItem(item, mode)
                    }
                    icon={isEquipped ? Check : Star}
                  >
                    {isEquipped ? t("shop.equipped") : t("shop.equip")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => purchaseItem(item, mode)}
                    icon={Coins}
                  >
                    {t("shop.buy")} ·{" "}
                    {formatNumber(item.price, settings.locale)}
                  </Button>
                )}
                <span className={`item-availability ${isOwned ? "owned" : ""}`}>
                  {isOwned
                    ? t("shop.owned")
                    : balance >= item.price
                      ? t("common.play")
                      : t("shop.coinsNeeded", {
                          amount: formatNumber(
                            item.price - balance,
                            settings.locale,
                          ),
                          unit: t(
                            isSingle ? "shop.unit.single" : "shop.unit.multi",
                          ),
                        })}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
      {!filtered.length && (
        <Card className="shop-empty">
          <Sparkles size={20} />
          <strong>{t("shop.noItems")}</strong>
        </Card>
      )}
      <div className="shop-footer-banner">
        <div className="shop-footer-icon">
          <KeyRound size={20} />
        </div>
        <div>
          <strong>{t("dashboard.quickPlay")}</strong>
          <span>{t("dashboard.noProgress")}</span>
        </div>
        <LinkButton
          to={isSingle ? "/single" : "/multi"}
          variant="quiet"
          icon={ArrowRight}
        >
          {t("common.play")}
        </LinkButton>
      </div>
    </main>
  );
}
