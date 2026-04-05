import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Contact, ContactType, useContacts } from "@/context/ContactsContext";
import { useI18n } from "@/context/I18nContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  editContact?: Contact;
}

export default function AddContactModal({ visible, onClose, editContact }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { addContact, updateContact } = useContacts();

  const [name,    setName]    = useState("");
  const [type,    setType]    = useState<ContactType>("client");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [address, setAddress] = useState("");
  const [taxId,   setTaxId]   = useState("");
  const [notes,   setNotes]   = useState("");
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (editContact) {
      setName(editContact.name);
      setType(editContact.type);
      setEmail(editContact.email ?? "");
      setPhone(editContact.phone ?? "");
      setAddress(editContact.address ?? "");
      setTaxId(editContact.taxId ?? "");
      setNotes(editContact.notes ?? "");
    } else {
      resetFields();
    }
  }, [editContact, visible]);

  function resetFields() {
    setName(""); setType("client"); setEmail(""); setPhone("");
    setAddress(""); setTaxId(""); setNotes(""); setError("");
  }

  function handleSave() {
    if (!name.trim()) { setError(t("con_errorName")); return; }
    setError("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data = {
      name: name.trim(), type,
      email:   email.trim()   || undefined,
      phone:   phone.trim()   || undefined,
      address: address.trim() || undefined,
      taxId:   taxId.trim()   || undefined,
      notes:   notes.trim()   || undefined,
    };
    if (editContact) {
      updateContact(editContact.id, data);
    } else {
      addContact(data);
    }
    resetFields();
    onClose();
  }

  function handleClose() { resetFields(); onClose(); }

  const typeOptions: { key: ContactType; label: string; icon: string; color: string }[] = [
    { key: "client",   label: t("con_client"),   icon: "briefcase",  color: "#1d4ed8" },
    { key: "customer", label: t("con_customer"),  icon: "user",       color: "#7c3aed" },
    { key: "supplier", label: t("con_supplier"),  icon: "truck",      color: "#b45309" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Platform.OS === "web" ? 67 : 16 }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {editContact ? t("con_editTitle") : t("con_addTitle")}
          </Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.saveBtnText, { color: "#fff" }]}>{t("con_save")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">

          {/* Type selector */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("con_type")}</Text>
          <View style={[styles.typeRow, { backgroundColor: colors.muted }]}>
            {typeOptions.map(opt => {
              const active = type === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.typeBtn, active && { backgroundColor: opt.color }]}
                  onPress={() => setType(opt.key)}
                >
                  <Feather name={opt.icon as any} size={14} color={active ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.typeBtnText, { color: active ? "#fff" : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Name */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("con_name")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.border, color: colors.foreground }]}
            placeholder={t("con_namePlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={v => { setName(v); setError(""); }}
            testID="contact-name-input"
          />

          {/* Email */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("con_email")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder={t("con_emailPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="contact-email-input"
          />

          {/* Phone */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("con_phone")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder={t("con_phonePlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            testID="contact-phone-input"
          />

          {/* Address */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("con_address")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder={t("con_addressPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={address}
            onChangeText={setAddress}
            testID="contact-address-input"
          />

          {/* Tax ID */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("con_taxId")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder={t("con_taxIdPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={taxId}
            onChangeText={setTaxId}
            testID="contact-taxid-input"
          />

          {/* Notes */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t("con_notes")}</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder={t("con_notesPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            testID="contact-notes-input"
          />

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn:    { padding: 6 },
  title:       { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  content:     { padding: 20, gap: 6 },
  label:       { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 14, marginBottom: 6 },
  input:       { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  notesInput:  { minHeight: 80, textAlignVertical: "top" },
  typeRow:     { flexDirection: "row", borderRadius: 14, padding: 4, gap: 2 },
  typeBtn:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 10 },
  typeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  error:       { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 8, textAlign: "center" },
});
