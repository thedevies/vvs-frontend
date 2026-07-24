import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/context/ThemeContext';

interface DropdownPickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function DropdownPickerModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: DropdownPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { colors, isDark } = useAppTheme();

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((item) => item.toLowerCase().includes(q));
  }, [options, searchQuery]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={`Search ${title}...`}
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Options List */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isSelected = item.toLowerCase() === (selectedValue || '').toLowerCase();
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: 'rgba(255, 77, 141, 0.12)' },
                    ]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                      setSearchQuery('');
                    }}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        { color: colors.text },
                        isSelected && { color: '#FF4D8D', fontWeight: '700' },
                      ]}
                    >
                      {item}
                    </ThemedText>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#FF4D8D" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                    No results found for "{searchQuery}"
                  </ThemedText>
                </View>
              }
            />

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 14.5,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
