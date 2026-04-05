import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  Alert, FlatList, Platform, Pressable,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Contact, ContactType, useContacts } from "@/context/ContactsContext";
import { useI18n } from "@/context/I18nContext";
import AddContactModal from "@/components/AddContactModal";

type Filter = "all" | ContactType;

const TYPE_META: Record<ContactType, { color: string; bgColor: string; icon: string }> = {
  client:   { color: "#1d4ed8", bgColor: "rgba(29,78,216,0.12)",  icon: "briefcase" },
  customer: { color: "#7c3aed", bgColor: "rgba(124,58,237,0.12)", icon: "user"      },
  supplier: { color: "#b45309", bgColor: "rgba(180,83,9,0.12)",   icon: "truck"     },
};

function ContactCard({ contact, onEdit }: { contact: Contact; onEdit: (c: Contact) => void }) {
  const colors = useColors();
  const { t, locale } = useI18n();
  const { deleteContact } = useContacts();
  const meta = TYPE_META[contact.type];
  const [expanded, setExpanded] = useState(false);

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t("con_delete"), t("con_deleteConfirm"), [
      { text: t("con_cancel"), style: "cancel" },
      { text: t("set_delete"), style: "destructive", onPress: () => deleteContact(contact.id) },
    ]);
  }

  const dateStr = new Date(contact.createdAt).toLocaleDateString(locale, {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <Pressable
      onPress={() => setExpanded(e => !e)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardMain}>
        <View style={[styles.avatar, { backgroundColor: meta.bgColor }]}>
          <Feather name={meta.icon as any} size={20} color={meta.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {contact.name}
          </Text>
          <View style={styles.cardMeta}>
            <View style={[styles.typeBadge, { backgroundColor: meta.bgColor, borderColor: meta.color + "50" }]}>
              <Text style={[styles.typeBadgeText, { color: meta.color }]}>
                {t(`con_${contact.type}` as any)}
              </Text>
            </View>
            {contact.phone ? (
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                <Feather name="phone" size={11} /> {contact.phone}
              </Text>
            ) : contact.email ? (
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                <Feather name="mail" size={11} /> {contact.email}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => onEdit(contact)} style={styles.actionBtn} testID="edit-contact">
            <Feather name="edit-2" size={15} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn} testID="delete-contact">
            <Feather name="trash-2" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {expanded && (
        <View style={[styles.expanded, { borderTopColor: colors.border }]}>
          {contact.email ? (
            <View style={styles.detailRow}>
              <Feather name="mail" size={13} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.foreground }]}>{contact.email}</Text>
            </View>
          ) : null}
          {contact.phone ? (
            <View style={styles.detailRow}>
              <Feather name="phone" size={13} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.foreground }]}>{contact.phone}</Text>
            </View>
          ) : null}
          {contact.address ? (
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={13} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.foreground }]}>{contact.address}</Text>
            </View>
          ) : null}
          {contact.taxId ? (
            <View style={styles.detailRow}>
              <Feather name="hash" size={13} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.foreground }]}>{contact.taxId}</Text>
            </View>
          ) : null}
          {contact.notes ? (
            <View style={styles.detailRow}>
              <Feather name="file-text" size={13} color={colors.mutedForeground} />
              <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{contact.notes}</Text>
            </View>
          ) : null}
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{dateStr}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function ContactsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { contacts } = useContacts();

  const [filter,  setFilter]  = useState<Filter>("all");
  const [search,  setSearch]  = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editContact, setEditContact] = useState<Contact | undefined>(undefined);

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter !== "all") list = list.filter(c => c.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.taxId?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, filter, search]);

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditContact(undefined);
    setModalVisible(true);
  }

  function handleEdit(c: Contact) {
    setEditContact(c);
    setModalVisible(true);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filters: { key: Filter; label: string }[] = [
    { key: "all",      label: t("con_all")       },
    { key: "client",   label: t("con_clients")   },
    { key: "customer", label: t("con_customers") },
    { key: "supplier", label: t("con_suppliers") },
  ];

  const counts: Record<string, number> = {
    all:      contacts.length,
    client:   contacts.filter(c => c.type === "client").length,
    customer: contacts.filter(c => c.type === "customer").length,
    supplier: contacts.filter(c => c.type === "supplier").length,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t("con_title")}</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          testID="add-contact-btn"
        >
          <Feather name="user-plus" size={17} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={t("con_search")}
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            testID="contact-search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {filters.map(f => {
          const active = filter === f.key;
          const meta = f.key !== "all" ? TYPE_META[f.key as ContactType] : null;
          return (
            <Pressable
              key={f.key}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: meta ? meta.bgColor : colors.accent, borderColor: meta ? meta.color : colors.primary }
                  : { borderColor: colors.border },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[
                styles.filterText,
                { color: active ? (meta ? meta.color : colors.primary) : colors.mutedForeground,
                  fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" },
              ]}>
                {f.label}
              </Text>
              <View style={[styles.filterCount, { backgroundColor: active ? (meta ? meta.color + "25" : colors.primary + "20") : colors.muted }]}>
                <Text style={[styles.filterCountText, { color: active ? (meta ? meta.color : colors.primary) : colors.mutedForeground }]}>
                  {counts[f.key]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 100 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("con_empty")}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{t("con_emptyHint")}</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
            >
              <Feather name="user-plus" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>{t("con_addBtn")}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <ContactCard contact={item} onEdit={handleEdit} />}
      />

      <AddContactModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditContact(undefined); }}
        editContact={editContact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title:  { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },

  filterRow:      { flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, flexWrap: "wrap" },
  filterChip:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  filterText:     { fontSize: 12 },
  filterCount:    { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  filterCountText:{ fontSize: 11, fontFamily: "Inter_700Bold" },

  list: { paddingHorizontal: 16, paddingTop: 10, gap: 2 },

  card:     { borderRadius: 14, borderWidth: 1, marginVertical: 5, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardMain: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar:   { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  typeBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardSub:  { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardActions: { flexDirection: "row", gap: 4 },
  actionBtn:   { padding: 8 },

  expanded:  { paddingHorizontal: 14, paddingBottom: 14, gap: 8, borderTopWidth: 1, paddingTop: 12, marginTop: 2 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailText:{ flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  dateText:  { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },

  emptyState:   { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle:   { fontSize: 18, fontFamily: "Inter_600SemiBold", marginTop: 6 },
  emptySubtitle:{ fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
  emptyBtn:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
