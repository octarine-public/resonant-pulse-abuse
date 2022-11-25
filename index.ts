import {
	EntityManager,
	EventsSDK,
	GameRules,
	GameSleeper,
	GameState,
	item_ultimate_scepter,
	Menu,
	PhysicalItem,
	Unit,
	void_spirit_resonant_pulse
} from "github.com/octarine-public/wrapper/index"

let Isdropped = false
const Sleeper = new GameSleeper()
const ImagePath = "panorama/images/spellicons/void_spirit_resonant_pulse_png.vtex_c"

const entries = Menu.AddEntry("Utility")
const menu = entries.AddNode(
	"Resonant pulse abuse",
	ImagePath,
	"!!! Use own risk and lucky !!!\nFor abuse need ultimate scepter",
	0
)
const keyBind = menu.AddKeybind("Key")

const PhysicalItems = EntityManager.GetEntitiesByClass(PhysicalItem)
const Abilities = EntityManager.GetEntitiesByClass(void_spirit_resonant_pulse)

function PickupItem(owner: Unit) {
	const physicalItem = PhysicalItems.find(
		x => x.Item instanceof item_ultimate_scepter && owner.Distance2D(x) <= 200
	)
	if (physicalItem === undefined) {
		Isdropped = false
		Sleeper.ResetKey(owner.Handle)
		return
	}
	owner.PickupItem(physicalItem)
	Isdropped = false
}

EventsSDK.on("Tick", () => {
	if (GameRules === undefined || !GameState.IsConnected) return

	for (const ability of Abilities) {
		const owner = ability.Owner
		if (
			owner === undefined ||
			Sleeper.Sleeping(owner.Index) ||
			owner.IsIllusion ||
			!owner.IsAlive ||
			owner.IsSilenced ||
			owner.IsStunned
		)
			continue

		const ultimateScepter = owner.GetItemByClass(item_ultimate_scepter)

		if (keyBind.isPressed && ability.Cooldown === 0 && ability.ManaCost <= owner.Mana) {
			if (Isdropped) {
				ability.UseAbility()
			} else if (ultimateScepter?.IsDroppable && ability.CurrentCharges >= 2) {
				owner.DropItem(ultimateScepter, owner.Position)
				Sleeper.Sleep(GameState.Ping, owner.Index)
				Isdropped = true
				continue
			}
		}
		PickupItem(owner)
	}
})

EventsSDK.on("GameEnded", () => {
	Isdropped = false
	Sleeper.FullReset()
})

EventsSDK.on("GameStarted", () => {
	Isdropped = false
	Sleeper.FullReset()
})
