const placeholderCards = [
  {
    id: 'placeholder-pair-1',
    type: 'Placeholder Pair 1',
    image: 'https://placehold.co/600x400/0F172A/FFFFFF?text=Pair+1',
    altText: 'Placeholder Pair 1 card artwork'
  },
  {
    id: 'placeholder-pair-2',
    type: 'Placeholder Pair 2',
    image: 'https://placehold.co/620x420/0369A1/F1F5F9?text=Pair+2',
    altText: 'Placeholder Pair 2 card artwork'
  },
  {
    id: 'placeholder-pair-3',
    type: 'Placeholder Pair 3',
    image: 'https://placehold.co/640x440/0EA5E9/0B1120?text=Pair+3',
    altText: 'Placeholder Pair 3 card artwork'
  },
  {
    id: 'placeholder-pair-4',
    type: 'Placeholder Pair 4',
    image: 'https://placehold.co/660x460/1D4ED8/F8FAFC?text=Pair+4',
    altText: 'Placeholder Pair 4 card artwork'
  },
  {
    id: 'placeholder-pair-5',
    type: 'Placeholder Pair 5',
    image: 'https://placehold.co/680x480/4338CA/EFF6FF?text=Pair+5',
    altText: 'Placeholder Pair 5 card artwork'
  },
  {
    id: 'placeholder-pair-6',
    type: 'Placeholder Pair 6',
    image: 'https://placehold.co/700x500/7C3AED/FDF4FF?text=Pair+6',
    altText: 'Placeholder Pair 6 card artwork'
  }
];

const uniqueCardsArray = placeholderCards.map((card) => ({ ...card }));

export default uniqueCardsArray;
