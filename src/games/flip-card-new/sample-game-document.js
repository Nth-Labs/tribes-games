const sampleFlipCardNewGameDocument = {
  _id: { $oid: '68d802d09d7be2b64fcdcca4' },
  game_id: '863242b1-e221-4d36-b2b7-7bf31090a749',
  game_template_id: 'flip-card-new',
  merchant_id: '39aa65fc-6011-70c3-3031-9dc9145858f9',
  name: 'Test Game 1',
  game_background_image:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/game_background_image-1758986960228.png',
  game_logo_image:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/game_logo_image-1758986960019.png',
  start_date: { $date: { $numberLong: '1758986555527' } },
  end_date: { $date: { $numberLong: '1760628155000' } },
  status: 'Active',
  is_active: false,
  hard_play_count_limit: { $numberInt: '20' },
  play_count: { $numberInt: '0' },
  prizes: {
    prize_1: {
      min_score: { $numberInt: '10' },
      type: 'Voucher',
      voucher_batch_id: '6b5bc5ac-a788-496a-a10f-280d4fcd6202'
    },
    prize_2: {
      min_score: { $numberInt: '0' },
      type: 'Voucher',
      voucher_batch_id: 'deff4b12-dd2f-43c5-ac3a-d56079d6462b'
    }
  },
  distribution_type: 'score_threshold',
  title: 'Azure Breeze Flip Challenge SHAH',
  subtitle: 'Match the pairs before you run out of moves. FUCKER',
  move_limit: { $numberInt: '8' },
  initial_reveal_seconds: { $numberInt: '3' },
  card_upflip_seconds: { $numberDouble: '1.2' },
  primary_color: '#fdfaf5',
  secondary_color: '#7DD3FC',
  tertiary_color: '#FDE0AB',
  card_back_image:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/card_back_image-1758986960320.png',
  image_1:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_1-1758986960368.png',
  image_2:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_2-1758986960476.png',
  image_3:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_3-1758986960622.png',
  image_4:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_4-1758986960812.png',
  image_5:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_5-1758986960905.png',
  image_6:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_6-1758986961048.png',
  image_7:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_7-1758986961222.png',
  image_8:
    'https://nthdimension-merchants.s3.amazonaws.com/merchants/39aa65fc-6011-70c3-3031-9dc9145858f9/games/863242b1-e221-4d36-b2b7-7bf31090a749/public/image_8-1758986961448.png',
  createdAt: { $date: { $numberLong: '1758986961614' } },
  updatedAt: { $date: { $numberLong: '1759126494152' } },
  __v: { $numberInt: '0' }
};

export default sampleFlipCardNewGameDocument;
