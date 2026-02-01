import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Types
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OrderInfo {
  orderId: string;
  status: 'processing' | 'shipped' | 'delivered' | 'pending';
  tracking?: string;
  items: string[];
  estimatedDelivery?: string;
}

// RAG: Load knowledge base
async function loadKnowledge(): Promise<{
  products: any;
  wheelbases: any;
  pedals: any;
  parts: any;
  faqIssues: any;
}> {
  const basePath = process.cwd();
  
  try {
    const [products, wheelbases, pedals, parts, faqIssues] = await Promise.all([
      fs.readFile(path.join(basePath, 'knowledge/products/catalog.json'), 'utf-8'),
      fs.readFile(path.join(basePath, 'knowledge/compatibility/wheelbases.json'), 'utf-8'),
      fs.readFile(path.join(basePath, 'knowledge/compatibility/pedals.json'), 'utf-8'),
      fs.readFile(path.join(basePath, 'knowledge/parts/database.json'), 'utf-8'),
      fs.readFile(path.join(basePath, 'knowledge/support/faq-issues.json'), 'utf-8'),
    ]);
    
    return {
      products: JSON.parse(products),
      wheelbases: JSON.parse(wheelbases),
      pedals: JSON.parse(pedals),
      parts: JSON.parse(parts),
      faqIssues: JSON.parse(faqIssues),
    };
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return { products: {}, wheelbases: {}, pedals: {}, parts: {}, faqIssues: {} };
  }
}

// Detect intent from user message
function detectIntent(message: string): string[] {
  const lower = message.toLowerCase();
  const intents: string[] = [];
  
  // Sales intents
  if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('which rig') || lower.includes('what rig')) {
    intents.push('recommendation');
  }
  if (lower.includes('compatible') || lower.includes('work with') || lower.includes('fit')) {
    intents.push('compatibility');
  }
  if (lower.includes('what do i need') || lower.includes('setup') || lower.includes('getting started')) {
    intents.push('requirements');
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
    intents.push('pricing');
  }
  if (lower.includes('bundle') || lower.includes('package') || lower.includes('deal')) {
    intents.push('bundles');
  }
  
  // Support intents
  if (lower.includes('tracking') || lower.includes('where is my') || lower.includes('shipment')) {
    intents.push('tracking');
  }
  if (lower.includes('order') && (lower.includes('status') || lower.includes('when'))) {
    intents.push('order_status');
  }
  if (lower.includes('missing') || lower.includes('not included') || lower.includes('forgot')) {
    intents.push('missing_part');
  }
  if (lower.includes('damaged') || lower.includes('broken') || lower.includes('bent') || lower.includes('scratched')) {
    intents.push('damaged_part');
  }
  if (lower.includes('part number') || lower.includes('replacement')) {
    intents.push('parts_lookup');
  }
  
  // Issue/problem intents
  if (lower.includes('problem') || lower.includes('issue') || lower.includes('trouble') || lower.includes('help')) {
    intents.push('troubleshooting');
  }
  if (lower.includes('bolt') || lower.includes('screw') || lower.includes('t-nut') || lower.includes('thread')) {
    intents.push('hardware_issue');
  }
  if (lower.includes('flex') || lower.includes('wobble') || lower.includes('loose') || lower.includes('noise') || lower.includes('creak')) {
    intents.push('stability_issue');
  }
  if (lower.includes('align') || lower.includes('hole') || lower.includes('fit') || lower.includes('tolerance')) {
    intents.push('alignment_issue');
  }
  if (lower.includes('instruction') || lower.includes('manual') || lower.includes('assemble') || lower.includes('assembly') || lower.includes('build')) {
    intents.push('assembly_help');
  }
  if (lower.includes('slider') || lower.includes('seat') && (lower.includes('move') || lower.includes('noise'))) {
    intents.push('seat_issue');
  }
  if (lower.includes('monitor') && (lower.includes('stand') || lower.includes('mount') || lower.includes('gap'))) {
    intents.push('monitor_issue');
  }
  if (lower.includes('customer service') || lower.includes('support') || lower.includes('response') || lower.includes('ticket')) {
    intents.push('support_issue');
  }
  if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
    intents.push('return_inquiry');
  }
  
  // Equipment mentions
  if (lower.includes('fanatec')) intents.push('fanatec');
  if (lower.includes('moza')) intents.push('moza');
  if (lower.includes('simagic')) intents.push('simagic');
  if (lower.includes('thrustmaster')) intents.push('thrustmaster');
  if (lower.includes('logitech')) intents.push('logitech');
  if (lower.includes('heusinkveld')) intents.push('heusinkveld');
  
  return intents.length > 0 ? intents : ['general'];
}

// Build context from knowledge base based on intents
function buildContext(intents: string[], knowledge: any, userMessage: string): string {
  const contexts: string[] = [];
  
  // Add product info for sales queries
  if (intents.some(i => ['recommendation', 'requirements', 'pricing', 'bundles', 'compatibility'].includes(i))) {
    contexts.push(`## Track Racer Product Catalog\n${JSON.stringify(knowledge.products, null, 2)}`);
  }
  
  // Add wheelbase compatibility for specific brands
  const brands = ['fanatec', 'moza', 'simagic', 'thrustmaster', 'logitech'];
  const mentionedBrands = brands.filter(b => intents.includes(b));
  
  if (mentionedBrands.length > 0 || intents.includes('compatibility')) {
    const relevantWheelbases: any = {};
    for (const brand of mentionedBrands.length > 0 ? mentionedBrands : brands) {
      if (knowledge.wheelbases[brand]) {
        relevantWheelbases[brand] = knowledge.wheelbases[brand];
      }
    }
    contexts.push(`## Wheelbase Compatibility\n${JSON.stringify(relevantWheelbases, null, 2)}`);
    
    // Also add pedal compatibility
    const relevantPedals: any = {};
    for (const brand of mentionedBrands.length > 0 ? mentionedBrands : brands) {
      if (knowledge.pedals[brand]) {
        relevantPedals[brand] = knowledge.pedals[brand];
      }
    }
    if (intents.includes('heusinkveld') && knowledge.pedals.heusinkveld) {
      relevantPedals.heusinkveld = knowledge.pedals.heusinkveld;
    }
    contexts.push(`## Pedal Compatibility\n${JSON.stringify(relevantPedals, null, 2)}`);
  }
  
  // Add parts info for support queries
  if (intents.some(i => ['missing_part', 'damaged_part', 'parts_lookup'].includes(i))) {
    contexts.push(`## Parts Database\n${JSON.stringify(knowledge.parts, null, 2)}`);
  }
  
  // Add FAQ/Issues knowledge for troubleshooting
  const issueIntents = [
    'troubleshooting', 'hardware_issue', 'stability_issue', 'alignment_issue',
    'assembly_help', 'seat_issue', 'monitor_issue', 'support_issue', 'return_inquiry',
    'missing_part', 'damaged_part'
  ];
  
  if (intents.some(i => issueIntents.includes(i)) && knowledge.faqIssues) {
    // Find relevant issues based on keywords in user message
    const relevantIssues = knowledge.faqIssues.commonIssues?.filter((issue: any) => {
      const issueText = JSON.stringify(issue).toLowerCase();
      const words = userMessage.toLowerCase().split(/\s+/);
      return words.some(word => word.length > 3 && issueText.includes(word));
    }) || [];
    
    if (relevantIssues.length > 0) {
      contexts.push(`## Relevant Known Issues & Solutions\n${JSON.stringify(relevantIssues.slice(0, 5), null, 2)}`);
    }
    
    // Add FAQ for general questions
    if (knowledge.faqIssues.frequentQuestions) {
      contexts.push(`## Frequently Asked Questions\n${JSON.stringify(knowledge.faqIssues.frequentQuestions, null, 2)}`);
    }
    
    // Add pro tips for assembly help
    if (intents.includes('assembly_help') && knowledge.faqIssues.proTips) {
      contexts.push(`## Pro Tips\n${JSON.stringify(knowledge.faqIssues.proTips, null, 2)}`);
    }
  }
  
  return contexts.join('\n\n');
}

// Mock order lookup (in real app, would query database)
function lookupOrder(message: string): OrderInfo | null {
  // Extract order number patterns like TR-12345 or #12345
  const orderMatch = message.match(/(?:TR-?|#)?(\d{5,8})/i);
  
  if (orderMatch) {
    // Mock order data - in production this would query a real database
    const mockOrders: Record<string, OrderInfo> = {
      '12345': {
        orderId: 'TR-12345',
        status: 'shipped',
        tracking: 'FX123456789US',
        items: ['TR120', 'RS6 Racing Seat', 'Shifter Mount'],
        estimatedDelivery: 'February 5, 2026'
      },
      '67890': {
        orderId: 'TR-67890',
        status: 'processing',
        items: ['TR8 Pro', 'Triple Monitor Stand'],
        estimatedDelivery: 'February 8, 2026'
      }
    };
    
    const orderId = orderMatch[1];
    if (mockOrders[orderId]) {
      return mockOrders[orderId];
    }
    
    // Return a generic "order found" response for demo
    return {
      orderId: `TR-${orderId}`,
      status: 'processing',
      items: ['Track Racer Rig'],
      estimatedDelivery: 'Within 5-7 business days'
    };
  }
  
  return null;
}

// Call Ollama for AI response
async function callOllama(messages: Message[], context: string): Promise<string> {
  const tunnelUrl = process.env.OLLAMA_URL;
  const ollamaUrls = [
    ...(tunnelUrl ? [tunnelUrl] : []),
    'http://192.168.50.1:11434',
    'http://localhost:11434',
  ];
  
  const systemPrompt = `You are the Track Racer AI Assistant - a helpful, knowledgeable customer service agent for Track Racer, a premium sim racing rig manufacturer.

Your capabilities:
1. **Sales & Recommendations**: Help customers choose the right rig based on their wheelbase, pedals, and budget
2. **Compatibility Checks**: Verify if equipment will work with our rigs
3. **Order Support**: Check order status and tracking
4. **Parts Support**: Help identify missing or damaged parts, look up part numbers

Personality:
- Enthusiastic about sim racing
- Knowledgeable but not condescending  
- Efficient and helpful
- Always provide specific product recommendations when possible

When recommending products:
- Consider the customer's wheelbase torque level
- Match rig strength to their equipment
- Suggest bundles when they offer value
- Mention compatibility notes

For support issues:
- Ask for order number if not provided
- For missing parts, identify the specific part number needed
- For damaged parts, request photos and describe what information you need
- Be empathetic and solution-focused

${context ? `\n## Knowledge Base Context\n${context}` : ''}`;

  const fullMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages
  ];

  for (const baseUrl of ollamaUrls) {
    try {
      console.log(`Trying Ollama at ${baseUrl}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen3:8b',
          messages: fullMessages,
          stream: false,
          options: { temperature: 0.7 }
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        let content = data.message?.content || '';
        // Remove thinking tags if present
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        return content;
      }
    } catch (error) {
      console.log(`Ollama at ${baseUrl} not available`);
    }
  }
  
  // Fallback response
  return "I'm having trouble connecting to my AI backend right now. Please try again in a moment, or contact support directly at support@trackracer.com";
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }
    
    // Load knowledge base
    const knowledge = await loadKnowledge();
    
    // Detect intent
    const intents = detectIntent(lastMessage.content);
    console.log('Detected intents:', intents);
    
    // Check for order lookup
    let orderContext = '';
    if (intents.includes('tracking') || intents.includes('order_status')) {
      const order = lookupOrder(lastMessage.content);
      if (order) {
        orderContext = `\n\n## Order Information Found\n${JSON.stringify(order, null, 2)}`;
      }
    }
    
    // Build RAG context
    const context = buildContext(intents, knowledge, lastMessage.content) + orderContext;
    
    // Get AI response
    const response = await callOllama(messages, context);
    
    return NextResponse.json({ 
      response,
      intents,
      debug: process.env.NODE_ENV === 'development' ? { contextLength: context.length } : undefined
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
