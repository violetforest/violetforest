import { RoomLayout } from '../components/RoomLayout'
import { SketchBook } from '../components/SketchBook'

const SKETCHES = [
  { title: 'umru.miami', url: 'https://umru.miami' },
  { title: 'tones', url: 'https://violetforest.com/tones' },
  { title: 'lipstick', url: 'https://violetforest.com/lipstick' },
  { title: 'flowers', url: 'https://violetforest.com/flowers' },
  {
    title: 'fxhash #1',
    url: 'https://gateway.fxhash2.xyz/ipfs/QmPvBJb5aMHQDcTYhHuzkLz25hY9mRaZ6XnJTbnhEkaPW2/?cid=ipfs%3A%2F%2FQmPvBJb5aMHQDcTYhHuzkLz25hY9mRaZ6XnJTbnhEkaPW2&fxhash=ooKQPrjw3sHouaHookoRH4yHbbZi1ykD2GELL6DVzbfvjPp2hhH&fxminter=tz1Sb1yoMGWguDKrZmwcuCJe46Qe1ftW4zc4&fxiteration=1&fxcontext=standalone&fxchain=TEZOS&legacy=false',
  },
  {
    title: 'fxhash #2',
    url: 'https://gateway.fxhash2.xyz/ipfs/QmaA49t9Royuyof1Wc3N2Zj3X37cFs4aVFKbPn1KXrzsec/?cid=ipfs%3A%2F%2FQmaA49t9Royuyof1Wc3N2Zj3X37cFs4aVFKbPn1KXrzsec&fxhash=ooyyDwZLYd1XuPSDoszTJogKAgh77ajQFnGEiKE9kPxw7Ya4J2G&fxminter=tz1B8VRsccdBLnpv8fQBMwvV1cTKuGraehUE&fxiteration=1&fxcontext=standalone&fxchain=TEZOS&legacy=false',
  },
  {
    title: 'fxhash #3',
    url: 'https://gateway.fxhash2.xyz/ipfs/QmWs3JZryNzhxBNJE3VkREws8HnzDRnQWDUaFfzG81phjM/?cid=ipfs%3A%2F%2FQmWs3JZryNzhxBNJE3VkREws8HnzDRnQWDUaFfzG81phjM&fxhash=ooGnyANRk1nrJrAG6Tp9u1LAVZREWeYDJcLSK1gbrhpZ797X9ZP&fxminter=tz1o8cQFjzFwCS5CiTSEZwJGKz6Uqw6un7Vq&fxiteration=1&fxcontext=standalone&fxchain=TEZOS&legacy=false',
  },
  {
    title: 'fxhash #4',
    url: 'https://gateway.fxhash2.xyz/ipfs/QmPEYFRzKQLRfZVe7YApGZ6iV7Cf6sTKgJCRNDdB4pp8YD/?cid=QmPEYFRzKQLRfZVe7YApGZ6iV7Cf6sTKgJCRNDdB4pp8YD&fxhash=op8K9RnUCFW4oFUgPX2yFGuZyUegCZEp4w6iHkWYP3T3JBb4ADW&fxminter=tz1WRboGJrpU2iUz537rwwaShwtQFA3KmUd2&fxiteration=7&fxcontext=standalone&fxchain=TEZOS&legacy=false',
  },
]

export function Making() {
  return (
    <RoomLayout>
      <SketchBook sketches={SKETCHES} />
    </RoomLayout>
  )
}
