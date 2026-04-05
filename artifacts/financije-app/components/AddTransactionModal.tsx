import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState, useMemo } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { PaymentMethod, TransactionType, useFinance } from "@/context/FinanceContext";
import { useContacts } from "@/context/ContactsContext";
import { useI18n } from "@/context/I18nContext";

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

export default function AddTransactionModal({
  visible,
  onClose,
  defaultType = "expense",
}: AddTransactionModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { categories, addTransaction, currency } = useFinance();
  const { contacts } = useContacts();

  const [type,             setType]             = useState<TransactionType>(defaultType);
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod>("bank");
  const [amount,           setAmount]           = useState("");
  const [description,      setDescription]      = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [date,             setDate]             = useState(new Date().toISOString().split("T")[0]);
  const [contactId,        setContactId]        = useState<string | undefined>(undefined);
  const [contactSearch,    setContactSearch]    = useState("");
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [error,            setError]            = useState("");

  const filteredCats = categories.filter(c => c.type === type);

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const selectedContact = contacts.find(c => c.id === contactId);

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setSelectedCategory("");
  }

  function handleSave() {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError(t("mod_errorAmount"));
      return;
    }
    if (!selectedCategory) {
      setError(t("mod_errorCategory"));
      return;
    }
    if (!date) {
      setError(t("mod_errorDate"));
      return;
    }
    setError("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTransaction({ type, paymentMethod, amount: parseFloat(amount), category: selectedCategory, description, date, contactId });
    resetAndClose();
  }

  function resetAndClose() {
    setAmount(""); setDescription(""); setSelectedCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setError(""); setType(defaultType); setPaymentMethod("bank");
    setContactId(undefined); setContactSearch(""); setContactPickerOpen(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Platform.OS === "web" ? 67 : 16 }]}>
          <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("mod_title")}</Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>{t("mod_save")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Income / Expense toggle */}
          <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
            <Pressable
              style={[styles.typeBtn, type === "income" && { backgroundColor: colors.income }]}
              onPress={() => handleTypeChange("income")}
            >
              <Feather name="trending-up" size={16} color={type === "income" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.typeBtnText, { color: type === "income" ? "#fff" : colors.mutedForeground }]}>
                {t("mod_income")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeBtn, type === "expense" && { backgroundColor: colors.expense }]}
              onPress={() => handleTypeChange("expense")}
            >
              <Feather name="trending-down" size={16} color={type === "expense" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.typeBtnText, { color: type === "expense" ? "#fff" : colors.mutedForeground }]}>
                {t("mod_expense")}
              </Text>
            </Pressable>
          </View>

          {/* Amount */}
          <View style={[styles.amountContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>
              {currency.symbol}
            </Text>
            <TextInput
              style={[styles.amountInput, { color: colors.foreground }]}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              testID="amount-input"
            />
          </View>

          {/* Date */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("mod_date")}</Text>
          <View style={[styles.dateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.dateInput, { color: colors.foreground }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              value={date}
              onChangeText={setDate}
              testID="date-input"
            />
          </View>

          {/* Description */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("mod_description")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder={t("mod_descriptionPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            testID="description-input"
          />

          {/* Client / Partner */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("mod_contact")}</Text>
          {contacts.length === 0 ? (
            <View style={[styles.noContactBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="users" size={14} color={colors.mutedForeground} />
              <Text style={[styles.noContactText, { color: colors.mutedForeground }]}>{t("mod_noContacts")}</Text>
            </View>
          ) : (
            <>
              {/* Selected contact pill OR picker trigger */}
              {selectedContact ? (
                <View style={[styles.selectedContactRow, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
                  <Feather name="user" size={14} color={colors.primary} />
                  <Text style={[styles.selectedContactName, { color: colors.primary }]} numberOfLines={1}>
                    {selectedContact.name}
                  </Text>
                  <Text style={[styles.selectedContactType, { color: colors.mutedForeground }]}>
                    {t(`con_${selectedContact.type}` as any)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setContactId(undefined); setContactPickerOpen(false); }}
                    style={styles.clearContactBtn}
                  >
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.contactPickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setContactPickerOpen(o => !o)}
                  testID="contact-picker-btn"
                >
                  <Feather name="user-plus" size={15} color={colors.mutedForeground} />
                  <Text style={[styles.contactPickerBtnText, { color: colors.mutedForeground }]}>
                    {t("mod_contactSearch")}
                  </Text>
                  <Feather name={contactPickerOpen ? "chevron-up" : "chevron-down"} size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}

              {/* Expanded contact list */}
              {contactPickerOpen && !selectedContact && (
                <View style={[styles.contactDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.contactSearchRow, { borderBottomColor: colors.border }]}>
                    <Feather name="search" size={14} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.contactSearchInput, { color: colors.foreground }]}
                      placeholder={t("mod_contactSearch")}
                      placeholderTextColor={colors.mutedForeground}
                      value={contactSearch}
                      onChangeText={setContactSearch}
                      autoFocus
                    />
                    {contactSearch ? (
                      <TouchableOpacity onPress={() => setContactSearch("")}>
                        <Feather name="x" size={13} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {filteredContacts.slice(0, 8).map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.contactItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setContactId(c.id);
                        setContactPickerOpen(false);
                        setContactSearch("");
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <View style={[styles.contactItemAvatar, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.contactItemInitial, { color: colors.foreground }]}>
                          {c.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.contactItemInfo}>
                        <Text style={[styles.contactItemName, { color: colors.foreground }]} numberOfLines={1}>
                          {c.name}
                        </Text>
                        {c.email || c.phone ? (
                          <Text style={[styles.contactItemSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {c.email || c.phone}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.contactItemType, { color: colors.mutedForeground }]}>
                        {t(`con_${c.type}` as any)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {filteredContacts.length === 0 && (
                    <View style={styles.noResultsBox}>
                      <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>{t("mod_noContacts")}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* Payment method */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("mod_paymentMethod")}</Text>
          <View style={[styles.paymentToggle, { backgroundColor: colors.muted }]}>
            <Pressable
              style={[styles.paymentBtn, paymentMethod === "bank" && { backgroundColor: colors.primary }]}
              onPress={() => setPaymentMethod("bank")}
              testID="payment-bank"
            >
              <Feather name="credit-card" size={15} color={paymentMethod === "bank" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.paymentBtnText, { color: paymentMethod === "bank" ? "#fff" : colors.mutedForeground }]}>
                {t("mod_bank")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.paymentBtn, paymentMethod === "cash" && { backgroundColor: "#854d0e" }]}
              onPress={() => setPaymentMethod("cash")}
              testID="payment-cash"
            >
              <Feather name="dollar-sign" size={15} color={paymentMethod === "cash" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.paymentBtnText, { color: paymentMethod === "cash" ? "#fff" : colors.mutedForeground }]}>
                {t("mod_cash")}
              </Text>
            </Pressable>
          </View>

          {/* Category */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("mod_category")}</Text>
          <View style={styles.categoriesGrid}>
            {filteredCats.map(cat => (
              <Pressable
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.name
                        ? type === "income" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"
                        : colors.card,
                    borderColor:
                      selectedCategory === cat.name
                        ? type === "income" ? colors.income : colors.expense
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.name)}
                testID={`category-${cat.name}`}
              >
                <Feather
                  name={cat.icon as any}
                  size={14}
                  color={selectedCategory === cat.name ? (type === "income" ? colors.income : colors.expense) : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.catChipText,
                    { color: selectedCategory === cat.name ? (type === "income" ? colors.income : colors.expense) : colors.foreground },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn:        { padding: 6 },
  title:           { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText:     { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  content:         { padding: 20, gap: 8 },
  typeToggle:      { flexDirection: "row", borderRadius: 14, padding: 4, marginBottom: 12 },
  typeBtn:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  typeBtnText:     { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  amountContainer: { flexDirection: "row", alignItems: "center", borderBottomWidth: 2, paddingBottom: 8, marginBottom: 20 },
  currencySymbol:  { fontSize: 28, fontFamily: "Inter_400Regular", marginRight: 8 },
  amountInput:     { flex: 1, fontSize: 40, fontFamily: "Inter_700Bold" },
  sectionLabel:    { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 12, marginBottom: 6 },
  input:           { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 4 },
  dateRow:         { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 4 },
  dateInput:       { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  paymentToggle:   { flexDirection: "row", borderRadius: 14, padding: 4 },
  paymentBtn:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  paymentBtnText:  { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  categoriesGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  catChip:         { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  catChipText:     { fontSize: 13, fontFamily: "Inter_500Medium" },
  error:           { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 8, textAlign: "center" },

  noContactBox:       { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", padding: 14 },
  noContactText:      { fontSize: 14, fontFamily: "Inter_400Regular" },

  contactPickerBtn:     { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  contactPickerBtnText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },

  selectedContactRow:  { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, padding: 12 },
  selectedContactName: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  selectedContactType: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clearContactBtn:     { padding: 4 },

  contactDropdown:   { borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  contactSearchRow:  { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderBottomWidth: 1 },
  contactSearchInput:{ flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  contactItem:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1 },
  contactItemAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  contactItemInitial:{ fontSize: 15, fontFamily: "Inter_700Bold" },
  contactItemInfo:   { flex: 1 },
  contactItemName:   { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  contactItemSub:    { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  contactItemType:   { fontSize: 11, fontFamily: "Inter_400Regular" },
  noResultsBox:      { padding: 16, alignItems: "center" },
  noResultsText:     { fontSize: 14, fontFamily: "Inter_400Regular" },
});
