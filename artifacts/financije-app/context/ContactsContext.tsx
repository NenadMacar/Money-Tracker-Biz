import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ContactType = "client" | "customer" | "supplier";

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
}

interface ContactsContextType {
  contacts: Contact[];
  addContact: (c: Omit<Contact, "id" | "createdAt">) => void;
  updateContact: (id: string, updates: Partial<Omit<Contact, "id" | "createdAt">>) => void;
  deleteContact: (id: string) => void;
  getContactById: (id: string) => Contact | undefined;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

const CONTACTS_KEY = "@mofi_contacts";

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CONTACTS_KEY)
      .then(data => { if (data) setContacts(JSON.parse(data)); })
      .catch(() => {});
  }, []);

  async function save(list: Contact[]) {
    setContacts(list);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(list)).catch(() => {});
  }

  function addContact(c: Omit<Contact, "id" | "createdAt">) {
    const newContact: Contact = {
      ...c,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    save([newContact, ...contacts]);
  }

  function updateContact(id: string, updates: Partial<Omit<Contact, "id" | "createdAt">>) {
    save(contacts.map(c => c.id === id ? { ...c, ...updates } : c));
  }

  function deleteContact(id: string) {
    save(contacts.filter(c => c.id !== id));
  }

  const getContactById = useCallback((id: string) => contacts.find(c => c.id === id), [contacts]);

  return (
    <ContactsContext.Provider value={{ contacts, addContact, updateContact, deleteContact, getContactById }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error("useContacts must be used within ContactsProvider");
  return ctx;
}
