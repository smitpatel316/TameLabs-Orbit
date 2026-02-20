// Orbit - Sentiment Analysis Dashboard
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useOrbitStore } from '../stores/orbitStore';

// Sentiment analysis (simulated - in production would use AI API)
export const SentimentAnalyzer = {
  analyzeInteraction(summary, mood) {
    // Simple keyword-based sentiment
    const positiveWords = ['great', 'good', 'love', 'amazing', 'excellent', 'happy', 'fun', 'success', 'win', 'excited'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'fail', 'lost', 'angry', 'frustrated', 'stress'];
    
    const words = summary.toLowerCase().split(' ');
    let score = mood === 'positive' ? 20 : mood === 'negative' ? -20 : 0;
    
    words.forEach(word => {
      if (positiveWords.some(w => word.includes(w))) score += 10;
      if (negativeWords.some(w => word.includes(w))) score -= 10;
    });
    
    if (score >= 20) return { sentiment: 'positive', score, emoji: '😊', color: '#38A169' };
    if (score <= -20) return { sentiment: 'negative', score, emoji: '😔', color: '#E53E3E' };
    return { sentiment: 'neutral', score, emoji: '😐', color: '#A0AEC0' };
  },

  analyzeContact(contacts, interactions) {
    const results = [];
    
    contacts.forEach(contact => {
      const contactInteractions = interactions.filter(i => i.contactId === contact.id);
      
      if (contactInteractions.length === 0) {
        results.push({
          contact,
          sentiment: 'unknown',
          score: 0,
          emoji: '❓',
          color: '#718096',
          trend: 'stable',
          insights: 'No interactions to analyze'
        });
        return;
      }

      // Calculate sentiment from recent interactions
      const recent = contactInteractions.slice(0, 5);
      let totalScore = 0;
      
      recent.forEach(interaction => {
        const result = this.analyzeInteraction(interaction.summary, interaction.mood);
        totalScore += result.score;
      });
      
      const avgScore = totalScore / recent.length;
      
      // Determine trend by comparing recent to older
      const older = contactInteractions.slice(5, 10);
      let trend = 'stable';
      if (older.length > 0) {
        let olderScore = 0;
        older.forEach(i => {
          const r = this.analyzeInteraction(i.summary, i.mood);
          olderScore += r.score;
        });
        const olderAvg = olderScore / older.length;
        
        if (avgScore > olderAvg + 15) trend = 'improving';
        else if (avgScore < olderAvg - 15) trend = 'declining';
      }

      let sentiment, emoji, color, insights;
      if (avgScore >= 20) {
        sentiment = 'positive';
        emoji = '😊';
        color = '#38A169';
        insights = 'Recent interactions are positive!';
      } else if (avgScore <= -20) {
        sentiment = 'negative';
        emoji = '😔';
        color = '#E53E3E';
        insights = 'Recent interactions have been challenging';
      } else {
        sentiment = 'neutral';
        emoji = '😐';
        color = '#A0AEC0';
        insights = 'Interactions are generally neutral';
      }

      results.push({
        contact,
        sentiment,
        score: avgScore,
        emoji,
        color,
        trend,
        insights,
        interactionCount: contactInteractions.length
      });
    });

    return results;
  },

  getOverallInsights(results) {
    const positive = results.filter(r => r.sentiment === 'positive').length;
    const negative = results.filter(r => r.sentiment === 'negative').length;
    const improving = results.filter(r => r.trend === 'improving').length;
    const declining = results.filter(r => r.trend === 'declining').length;

    return {
      positive,
      negative,
      improving,
      declining,
      summary: positive > negative 
        ? 'Overall, your relationships are trending positive! 🎉'
        : negative > 0 
          ? 'Some relationships need attention. Check the details below.'
          : 'Your relationships are generally stable.'
    };
  }
};

export default function SentimentScreen() {
  const contacts = useOrbitStore((state) => state.contacts);
  const interactions = useOrbitStore((state) => state.interactions);
  
  const [filter, setFilter] = useState('all');
  
  const analysis = SentimentAnalyzer.analyzeContact(contacts, interactions);
  const overall = SentimentAnalyzer.getOverallInsights(analysis);
  
  const filtered = filter === 'all' 
    ? analysis 
    : filter === 'positive'
      ? analysis.filter(a => a.sentiment === 'positive')
      : filter === 'negative'
        ? analysis.filter(a => a.sentiment === 'negative')
        : filter === 'improving'
          ? analysis.filter(a => a.trend === 'improving')
          : filter === 'declining'
            ? analysis.filter(a => a.trend === 'declining')
            : analysis;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>💭 Sentiment Analysis</Text>

        {/* Overall Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{overall.summary}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#38A169' }]}>{overall.positive}</Text>
              <Text style={styles.statLabel}>Positive</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#A0AEC0' }]}>{analysis.filter(a => a.sentiment === 'neutral').length}</Text>
              <Text style={styles.statLabel}>Neutral</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: '#E53E3E' }]}>{overall.negative}</Text>
              <Text style={styles.statLabel}>Negative</Text>
            </View>
          </View>
        </View>

        {/* Trend Summary */}
        <View style={styles.trendRow}>
          <View style={[styles.trendBadge, { backgroundColor: '#38A169' }]}>
            <Text style={styles.trendText}>↑ {overall.improving} improving</Text>
          </View>
          <View style={[styles.trendBadge, { backgroundColor: '#E53E3E' }]}>
            <Text style={styles.trendText}>↓ {overall.declining} declining</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          {['all', 'positive', 'negative', 'improving', 'declining'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact List */}
        {filtered.map((item) => (
          <View key={item.contact.id} style={[styles.card, { borderLeftColor: item.color }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text style={styles.avatarText}>{item.contact.name[0]}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.contactName}>{item.contact.name}</Text>
                <Text style={styles.insights}>{item.insights}</Text>
              </View>
              <View style={styles.sentiment}>
                <Text style={styles.sentimentEmoji}>{item.emoji}</Text>
                {item.trend !== 'stable' && (
                  <Text style={styles.trendIndicator}>
                    {item.trend === 'improving' ? '↑' : '↓'}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.meta}>
                {item.interactionCount} interactions • Score: {item.score}
              </Text>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No contacts match this filter</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#16213e' },
  content: { padding: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  summaryCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#A0AEC0', fontSize: 12 },
  trendRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  trendBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  trendText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1a1a2e', borderRadius: 16 },
  filterActive: { backgroundColor: '#E53E3E' },
  filterText: { color: '#A0AEC0', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { flex: 1, marginLeft: 12 },
  contactName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  insights: { color: '#A0AEC0', fontSize: 13, marginTop: 2 },
  sentiment: { alignItems: 'center' },
  sentimentEmoji: { fontSize: 24 },
  trendIndicator: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  cardFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2D3748' },
  meta: { color: '#718096', fontSize: 12 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#A0AEC0' },
});
