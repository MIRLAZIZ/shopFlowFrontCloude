import { useCookie } from '@/@core/composable/useCookie';
import { AbilityRule } from '@/type/ability.type';
import { createMongoAbility } from '@casl/ability';
import { abilitiesPlugin } from '@casl/vue';

export default function (app: any) {
  const userAbilityRules: any = useCookie<AbilityRule[]>('userAbilityRules')


  const initialAbility = createMongoAbility(userAbilityRules.value ?? [])
  let user = null


  app.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true,
  })
}
